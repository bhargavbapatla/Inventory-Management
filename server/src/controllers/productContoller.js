import pkg from 'express';
import { prisma } from "../config/db.js";
const { Request, Response } = pkg;


export const getAllProducts = async (req, res) => {
    const products = await prisma.product.findMany({
        where: {
            userId: req.userId ?? undefined,
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            totalCostPrice: true,
            makingCharge: true,
            ingredients: {
                select: {
                    inventory: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });
    return res.status(200).json({
        message: 'Products fetched successfully',
        status: 200,
        data: products,
    });
}

export const getProductById = async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: {
            id,
        },
        include: {
            ingredients: {
                include: {
                    inventory: true
                }
            }
        }
    });

    if (!product) {
        return res.status(404).json({
            message: 'Product not found',
            status: 404,
        });
    }

    return res.status(200).json({
        message: 'Product fetched successfully',
        status: 200,
        data: product,
    });
}


const getWeightInGrams = (weight, unit) => {
    switch (unit) {
        case 'GRAMS': return weight;
        case 'KGS': return weight * 1000;
        case 'POUNDS': return weight * 453.592;
        case 'LITERS': return weight * 1000;
        case 'PIECES': return weight;
        default: return weight;
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, makingCharge, description, ingredients } = req.body;

        let totalIngredientsCost = 0;

        if (ingredients && Array.isArray(ingredients)) {
            for (const item of ingredients) {
                if (item.inventoryId) {
                    const inventoryItem = await prisma.inventory.findUnique({
                        where: { id: item.inventoryId }
                    });

                    if (!inventoryItem) {
                        return res.status(404).json({
                            status: 404,
                            success: false,
                            message: "Inventory item not found."
                        });
                    }

                    let quantityNeededInBaseUnits = 0;
                    let totalHistoricalBaseUnits = 0;

                    // 1. NORMALIZE UNITS FOR BOTH INGREDIENTS AND PACKAGING
                    if (inventoryItem.category === 'INGREDIENTS') {
                        // e.g., 60 historical packs * 100g = 6,000 total grams ever bought
                        const weightOfOnePackInGrams = getWeightInGrams(inventoryItem.weight || 0, inventoryItem.unit);
                        totalHistoricalBaseUnits = (inventoryItem.quantity || 0) * weightOfOnePackInGrams;
                        
                        // Convert what the recipe needs into grams too
                        quantityNeededInBaseUnits = getWeightInGrams(item.quantityNeeded || 0, item.unit);
                    } else {
                        // For packaging, the quantity is the base unit (e.g., 60 boxes)
                        totalHistoricalBaseUnits = inventoryItem.quantity || 0;
                        quantityNeededInBaseUnits = item.quantityNeeded || 0;
                    }

                    // 2. STOCK VALIDATION (Using actual physical shelf stock)
                    // remainingStock is already tracked in base units (grams/ml/boxes) in your DB
                    const currentShelfStock = inventoryItem.remainingStock || 0;

                    if (quantityNeededInBaseUnits > currentShelfStock) {
                        const unitLabel = inventoryItem.category === 'PACKAGING' ? 'pieces/boxes' : 'g/ml';
                        return res.status(400).json({
                            status: 400,
                            success: false,
                            message: `Insufficient stock for ${inventoryItem.name}. You need ${quantityNeededInBaseUnits} ${unitLabel}, but only have ${currentShelfStock} ${unitLabel} available.`
                        });
                    }

                    // 3. THE AVERAGE COSTING MATH
                    // Total Money Ever Spent / Total Units Ever Bought
                    const averageCostPerBaseUnit = totalHistoricalBaseUnits > 0
                        ? (inventoryItem.price || 0) / totalHistoricalBaseUnits
                        : 0;

                    // Multiply exact average cost per gram/box by the amount needed
                    totalIngredientsCost += (averageCostPerBaseUnit * quantityNeededInBaseUnits);
                }
            }
        }

        const totalCostPrice = totalIngredientsCost + (makingCharge || 0);

        console.log("Total Ingredients Cost:", totalIngredientsCost);
        console.log("Total Cost Price:", totalCostPrice.toFixed(2));

        const product = await prisma.product.create({
            data: {
                name,
                makingCharge,
                description,
                totalCostPrice,
                ingredients: {
                    create: ingredients.map((i) => ({
                        inventoryId: i.inventoryId,
                        quantity: i.quantityNeeded,
                        unit: i.unit,
                    })),
                },
                user: req.userId
                    ? {
                        connect: {
                            id: req.userId,
                        },
                    }
                    : undefined,
            },
            include: {
                ingredients: true,
            },
        });

        return res.status(200).json({
            message: 'Product created successfully',
            status: 200,
            data: product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({
            message: 'Error creating product',
            status: 500,
            error
        });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, makingCharge, description, ingredients } = req.body;

        // 1. Check if the product actually exists and belongs to the user first
        const existing = await prisma.product.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!existing) {
            return res.status(404).json({
                message: 'Product not found',
                status: 404,
            });
        }

        let totalIngredientsCost = 0;

        // 2. Calculate total cost from ingredients using Cumulative Average
        if (ingredients && Array.isArray(ingredients)) {
            for (const item of ingredients) {
                if (item.inventoryId) {
                    const inventoryItem = await prisma.inventory.findUnique({
                        where: { id: item.inventoryId }
                    });

                    if (!inventoryItem) {
                        return res.status(404).json({
                            status: 404,
                            success: false,
                            message: "Inventory item not found."
                        });
                    }

                    let quantityNeededInBaseUnits = 0;
                    let totalHistoricalBaseUnits = 0;

                    // A. NORMALIZE UNITS FOR BOTH INGREDIENTS AND PACKAGING
                    if (inventoryItem.category === 'INGREDIENTS') {
                        // e.g., 60 historical packs * 100g = 6,000 total grams ever bought
                        const weightOfOnePackInGrams = getWeightInGrams(inventoryItem.weight || 0, inventoryItem.unit);
                        totalHistoricalBaseUnits = (inventoryItem.quantity || 0) * weightOfOnePackInGrams;
                        
                        // Convert what the recipe needs into grams too
                        quantityNeededInBaseUnits = getWeightInGrams(item.quantityNeeded || 0, item.unit);
                    } else {
                        // For packaging, the quantity is the base unit (e.g., 60 boxes)
                        totalHistoricalBaseUnits = inventoryItem.quantity || 0;
                        quantityNeededInBaseUnits = item.quantityNeeded || 0;
                    }

                    // B. STOCK VALIDATION (Using actual physical shelf stock)
                    const currentShelfStock = inventoryItem.remainingStock || 0;

                    if (quantityNeededInBaseUnits > currentShelfStock) {
                        const unitLabel = inventoryItem.category === 'PACKAGING' ? 'pieces/boxes' : 'g/ml';
                        return res.status(400).json({
                            status: 400,
                            success: false,
                            message: `Insufficient stock for ${inventoryItem.name}. You need ${quantityNeededInBaseUnits}${unitLabel}, but only have ${currentShelfStock}${unitLabel} available.`
                        });
                    }

                    // C. THE AVERAGE COSTING MATH
                    const averageCostPerBaseUnit = totalHistoricalBaseUnits > 0
                        ? (inventoryItem.price || 0) / totalHistoricalBaseUnits
                        : 0;

                    totalIngredientsCost += (averageCostPerBaseUnit * quantityNeededInBaseUnits);
                }
            }
        }

        const totalCostPrice = totalIngredientsCost + (makingCharge || 0);

        console.log("Total Ingredients Cost:", totalIngredientsCost);
        console.log("Total Cost Price:", totalCostPrice.toFixed(2));

        // 3. Update the database
        const product = await prisma.product.update({
            where: {
                id,
            },
            data: {
                name,
                makingCharge,
                description,
                totalCostPrice,
                ingredients: {
                    deleteMany: {}, // Clear out the old recipe ingredients
                    create: ingredients.map((i) => ({ // Insert the newly edited ones
                        inventoryId: i.inventoryId,
                        quantity: i.quantityNeeded,
                        unit: i.unit,
                    })),
                },
            },
            include: {
                ingredients: true,
            },
        })

        return res.status(200).json({
            message: 'Product updated successfully',
            status: 200,
            data: product,
        })
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            message: 'Error updating product',
            status: 500,
            error
        });
    }
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.product.findFirst({
        where: {
            id,
            userId: req.userId,
        },
    });
    if (!existing) {
        return res.status(404).json({
            message: 'Product not found',
            status: 404,
        });
    }
    const product = await prisma.product.delete({
        where: {
            id,
        }
    })
    return res.status(200).json({
        message: 'Product deleted successfully',
        status: 200,
        data: product,
    })
}
