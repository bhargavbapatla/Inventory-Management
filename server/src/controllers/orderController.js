import { prisma } from "../config/db.js";
import pkg from "express";
import { sendOrderConfirmation } from "../services/whatsappService.js";

const { Request, Response } = pkg;

const unitToBaseFactor = {
    GRAMS: 1,
    KGS: 1000,
    POUNDS: 453.592,
    LITERS: 1000,
    MILLILITERS: 1,
    PIECES: 1,
    BOXES: 1,
};

const toBaseUnits = (value, unit) => {
    if (!unit) return value;
    const factor = unitToBaseFactor[unit] ?? 1;
    return value * factor;
};

// --- INVENTORY HELPERS ---

export const deductInventoryForOrder = async (order, tx) => {
    const requirements = {};

    for (const orderItem of order.orderItems) {
        if (!orderItem.product) continue;

        for (const ingredient of orderItem.product.ingredients) {
            const requiredQuantity = ingredient.quantity * orderItem.quantity;
            let requiredBaseAmount = 0;

            // Safe check for Packaging vs Ingredients (Solids/Liquids)
            if (ingredient.category !== "PACKAGING") {
                requiredBaseAmount = toBaseUnits(requiredQuantity, ingredient.unit);
            } else {
                requiredBaseAmount = requiredQuantity;
            }

            if (!requirements[ingredient.inventoryId]) {
                requirements[ingredient.inventoryId] = 0;
            }
            requirements[ingredient.inventoryId] += requiredBaseAmount;
        }
    }

    const inventoryIds = Object.keys(requirements);
    if (inventoryIds.length === 0) return;

    const inventories = await tx.inventory.findMany({
        where: { id: { in: inventoryIds } },
    });

    const inventoryMap = new Map();
    for (const inventory of inventories) {
        inventoryMap.set(inventory.id, inventory);
    }

    for (const inventoryId of inventoryIds) {
        const requiredAmount = requirements[inventoryId];
        const inventoryRecord = inventoryMap.get(inventoryId);

        if (!inventoryRecord) throw new Error("INVENTORY_NOT_FOUND");

        const newRemainingStock = inventoryRecord.remainingStock - requiredAmount;

        if (newRemainingStock < 0) {
            const unitLabel = inventoryRecord.category === 'PACKAGING' ? 'pieces/boxes' : 'g/ml';
            throw new Error(
                `Insufficient Stock for "${inventoryRecord.name}". \nNeed: ${requiredAmount} ${unitLabel}\nHave: ${inventoryRecord.remainingStock} ${unitLabel}`
            );
        }

        // ONLY update physical stock. Never touch 'quantity' (historical packs)!
        await tx.inventory.update({
            where: { id: inventoryRecord.id },
            data: {
                remainingStock: newRemainingStock,
            },
        });
    }
};

export const restoreInventoryForOrder = async (order, tx) => {
    const requirements = {};

    for (const orderItem of order.orderItems) {
        if (!orderItem.product) continue;

        for (const ingredient of orderItem.product.ingredients) {
            const requiredQuantity = ingredient.quantity * orderItem.quantity;
            let requiredBaseAmount = 0;

            if (ingredient.category !== "PACKAGING") {
                requiredBaseAmount = toBaseUnits(requiredQuantity, ingredient.unit);
            } else {
                requiredBaseAmount = requiredQuantity;
            }

            if (!requirements[ingredient.inventoryId]) {
                requirements[ingredient.inventoryId] = 0;
            }
            requirements[ingredient.inventoryId] += requiredBaseAmount;
        }
    }

    const inventoryIds = Object.keys(requirements);
    if (inventoryIds.length === 0) return;

    const inventories = await tx.inventory.findMany({
        where: { id: { in: inventoryIds } },
    });

    const inventoryMap = new Map();
    for (const inventory of inventories) {
        inventoryMap.set(inventory.id, inventory);
    }

    for (const inventoryId of inventoryIds) {
        const requiredAmount = requirements[inventoryId];
        const inventoryRecord = inventoryMap.get(inventoryId);

        if (!inventoryRecord) continue;

        const newRemainingStock = inventoryRecord.remainingStock + requiredAmount;

        await tx.inventory.update({
            where: { id: inventoryRecord.id },
            data: {
                remainingStock: newRemainingStock,
            },
        });
    }
};

// --- CONTROLLERS ---

export const createOrder = async (req, res) => {
    try {
        const { customer, status, orderItems, orderDate, grandTotal, items } = req.body;
        const { name, phone, address, customerId } = customer;
        const userId = req.userId;

        const productIds = items.map(item => item.productId);

        const result = await prisma.$transaction(async (tx) => {
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: { ingredients: true }
            });

            const productMap = new Map(products.map(p => [p.id, p]));
            const ingredientUsage = new Map();

            // --- FIXED: Unit Conversion applied correctly to in-memory validation ---
            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) throw new Error(`Product ID ${item.productId} not found`);

                for (const ing of product.ingredients) {
                    const requiredQuantity = ing.quantity * Number(item.quantity);
                    let requiredBaseAmount = 0;

                    if (ing.category !== "PACKAGING") {
                        requiredBaseAmount = toBaseUnits(requiredQuantity, ing.unit);
                    } else {
                        requiredBaseAmount = requiredQuantity;
                    }

                    const currentNeeded = ingredientUsage.get(ing.inventoryId) || 0;
                    ingredientUsage.set(ing.inventoryId, currentNeeded + requiredBaseAmount);
                }
            }

            const inventoryIds = Array.from(ingredientUsage.keys());
            const inventoryItems = await tx.inventory.findMany({
                where: { id: { in: inventoryIds } }
            });

            const inventoryMap = new Map(inventoryItems.map(i => [i.id, i]));

            for (const [inventoryId, amountNeeded] of ingredientUsage.entries()) {
                const stockItem = inventoryMap.get(inventoryId);
                if (!stockItem) throw new Error(`Ingredient details missing for ID: ${inventoryId}`);

                const currentStock = stockItem.remainingStock || 0;

                if (currentStock < amountNeeded) {
                    const unitLabel = stockItem.category === 'PACKAGING' ? 'pieces/boxes' : 'g/ml';
                    throw new Error(
                        `Insufficient Stock for "${stockItem.name}". \nNeed: ${amountNeeded} ${unitLabel}\nHave: ${currentStock} ${unitLabel}`
                    );
                }
            }

            let customerResp;
            if (customerId) {
                customerResp = await tx.customer.findUnique({ where: { id: customerId } });
            } else {
                const customerData = { name, phone, address };
                if (userId) customerData.user = { connect: { id: userId } };
                customerResp = await tx.customer.create({ data: customerData });
            }

            const orderStatus = status || "PENDING";

            const createdOrder = await tx.order.create({
                data: {
                    customerName: name,
                    grandTotal: Number(grandTotal),
                    status: orderStatus,
                    orderDate: new Date(orderDate),
                    customer: { connect: { id: customerResp.id } },
                    orderItems: {
                        create: items.map((item) => ({
                            product: { connect: { id: item.productId } },
                            quantity: Number(item.quantity),
                            sellingPrice: Number(item.sellingPrice),
                        })),
                    },
                    user: userId ? { connect: { id: userId } } : undefined,
                },
                include: {
                    orderItems: { include: { product: { include: { ingredients: true } } } },
                    customer: true,
                }
            });

            // --- FIXED: If created instantly as ONGOING, deduct stock ---
            const isNowOngoingOrCompleted = ["ONGOING", "COMPLETED"].includes(orderStatus.toUpperCase());
            if (isNowOngoingOrCompleted) {
                await deductInventoryForOrder(createdOrder, tx);
            }

            return createdOrder;

        }, { timeout: 20000 });

        try {
            await sendOrderConfirmation(
                customer.phone,
                customer.name,
                Number(grandTotal),
                result.id
            );
        } catch (smsError) {
            console.error("SMS Failed but order created:", smsError);
        }

        return res.status(200).json({
            message: 'Order created successfully',
            status: 200,
            data: result,
        });

    } catch (error) {
        // --- FIXED: Safely return a 400 error to the frontend if stock is low ---
        const message = error instanceof Error ? (error.message ?? "Unknown error") : "Unknown error";
        
        if (message.startsWith('Insufficient Stock for "')) {
            return res.status(400).json({ message, status: 400 });
        }
        
        console.error("Order Creation Failed:", error);
        return res.status(400).json({
            message: 'Error creating order',
            status: 400,
            error: message,
        });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { customer, status, orderDate, grandTotal, items } = req.body;
        const { name, phone, address, customerId } = customer;

        const order = await prisma.$transaction(async (tx) => {
            let customerResp;

            if (!customerId) {
                customerResp = await tx.customer.create({
                    data: { name, phone, address },
                });
            } else {
                customerResp = { id: customerId };
            }

            const existingOrder = await tx.order.findFirst({
                where: { id: req.params.id, userId: req.userId },
                include: {
                    orderItems: {
                        include: { product: { include: { ingredients: true } } },
                    },
                },
            });

            if (!existingOrder) throw new Error("ORDER_NOT_FOUND");

            const nextStatus = status || "PENDING";
            const productIds = items.map((item) => item.productId);

            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: { ingredients: true },
            });

            const productMap = new Map(products.map((p) => [p.id, p]));
            const ingredientUsage = new Map();

            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) throw new Error(`Product ID ${item.productId} not found`);

                for (const ing of product.ingredients) {
                    const requiredQuantity = ing.quantity * Number(item.quantity);
                    let requiredBaseAmount = 0;

                    if (ing.category !== "PACKAGING") {
                        requiredBaseAmount = toBaseUnits(requiredQuantity, ing.unit);
                    } else {
                        requiredBaseAmount = requiredQuantity;
                    }

                    const currentNeeded = ingredientUsage.get(ing.inventoryId) || 0;
                    ingredientUsage.set(ing.inventoryId, currentNeeded + requiredBaseAmount);
                }
            }

            const inventoryIds = Array.from(ingredientUsage.keys());
            const inventoryItems = await tx.inventory.findMany({
                where: { id: { in: inventoryIds } },
            });

            const inventoryMap = new Map(inventoryItems.map((i) => [i.id, i]));

            for (const [inventoryId, amountNeeded] of ingredientUsage.entries()) {
                const stockItem = inventoryMap.get(inventoryId);
                if (!stockItem) throw new Error(`Ingredient details missing for ID: ${inventoryId}`);

                const currentStock = stockItem.remainingStock || 0;

                if (currentStock < amountNeeded) {
                    const unitLabel = stockItem.category === 'PACKAGING' ? 'pieces/boxes' : 'g/ml';
                    throw new Error(
                        `Insufficient Stock for "${stockItem.name}". \nNeed: ${amountNeeded} ${unitLabel}\nHave: ${currentStock} ${unitLabel}`
                    );
                }
            }

            // Optional: Restore logic goes here if handling status rollbacks
            
            const updatedOrder = await tx.order.update({
                where: { id: req.params.id },
                data: {
                    customerName: name,
                    grandTotal: Number(grandTotal),
                    status: nextStatus,
                    orderDate: new Date(orderDate),
                    customer: { connect: { id: customerResp.id } },
                    orderItems: {
                        deleteMany: {},
                        create: items.map((item) => ({
                            product: { connect: { id: item.productId } },
                            quantity: Number(item.quantity),
                            sellingPrice: Number(item.sellingPrice),
                        })),
                    },
                },
                include: {
                    orderItems: { include: { product: { include: { ingredients: true } } } },
                    customer: true,
                },
            });

            const isNowOngoingOrCompleted = ["ONGOING", "COMPLETED"].includes(nextStatus.toUpperCase());
            if (isNowOngoingOrCompleted) {
                await deductInventoryForOrder(updatedOrder, tx);
            }

            return updatedOrder;
        }, { timeout: 20000 });

        await sendOrderConfirmation(
            customer.phone,
            customer.name,
            Number(grandTotal),
            order.id
        );

        return res.status(200).json({
            message: "Order updated successfully",
            status: 200,
            data: order,
        });
    } catch (error) {
        const message = error instanceof Error ? (error.message ?? "Unknown error") : "Unknown error";

        if (message.startsWith('Insufficient Stock for "')) {
            return res.status(400).json({ message, status: 400 });
        }

        if (message === "ORDER_NOT_FOUND") return res.status(404).json({ message: "Order not found", status: 404 });
        if (message === "INSUFFICIENT_INVENTORY") return res.status(400).json({ message: "Insufficient inventory for this order", status: 400 });
        if (message === "INVENTORY_NOT_FOUND") return res.status(400).json({ message: "Inventory item not found for this order", status: 400 });

        return res.status(400).json({
            message: "Error updating order",
            status: 400,
            error: message,
        });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: req.userId ?? undefined,
            },
            include: {
                orderItems: {
                    include: { product: true }
                },
                customer: true
            }
        });
        return res.status(200).json({
            message: 'Orders fetched successfully',
            status: 200,
            data: orders,
        });
    } catch (error) {
        return res.status(400).json({
            message: 'Error fetching orders',
            status: 400,
            error: error?.message ?? "Unknown error",
        });
    }
}

export const getOrderById = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
        });
        return res.status(200).json({
            message: 'Order fetched successfully',
            status: 200,
            data: order,
        });
    } catch (error) {
        return res.status(400).json({
            message: 'Error fetching order',
            status: 400,
            error: error?.message ?? "Unknown error",
        });
    }
}

export const deleteOrder = async (req, res) => {
    try {
        const existingOrder = await prisma.order.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId,
            },
        });
        if (!existingOrder) {
            return res.status(404).json({
                message: "Order not found",
                status: 404,
            });
        }
        const order = await prisma.order.delete({
            where: { id: req.params.id },
        });
        return res.status(200).json({
            message: 'Order deleted successfully',
            status: 200,
            data: order,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ORDER_NOT_FOUND") {
                return res.status(404).json({ message: "Order not found", status: 404 });
            }
        }
        return res.status(400).json({
            message: 'Error deleting order',
            status: 400,
            error: error?.message ?? "Unknown error",
        });
    }
}