import { prisma } from "../config/db.js";
import { generateBakingAdvice } from "../services/aiService.js";
import { deductInventoryForOrder, restoreInventoryForOrder } from "./orderController.js"; 
import { generateSpeech } from "../services/voiceService.js"; 

const getBaseUnitLabel = (unit) => {
    const u = unit?.toUpperCase();
    if (['LITERS', 'MILLILITERS'].includes(u)) return 'ML';
    if (['KGS', 'POUNDS', 'GRAMS'].includes(u)) return 'GRAMS';
    return u || 'UNITS';
};

export const askAssistant = async (req, res) => {
    try {
        const { query, wantsAudio } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const userFilter = req.userId ? { userId: req.userId } : {};

        // 1. Fetch Context Data - FIXED: Removed select/include conflict
        const [rawInventory, rawRecipes, rawOrders] = await Promise.all([
            prisma.inventory.findMany({
                where: userFilter,
                select: { id: true, name: true, remainingStock: true, unit: true, lowStockThreshold: true, category: true },
            }),
            prisma.product.findMany({
                where: userFilter,
                include: { ingredients: { include: { inventory: { select: { name: true } } } } }
            }),
            prisma.order.findMany({
                where: userFilter, 
                take: 10, 
                orderBy: { orderDate: 'desc' },
                include: { 
                    customer: { select: { name: true } }, 
                    orderItems: { 
                        include: { 
                            product: { 
                                include: { 
                                    ingredients: true 
                                } 
                            } 
                        } 
                    } 
                },
            }),
        ]);

        // 2. Clean and format the data for AI
        const cleanInventory = rawInventory.map(item => ({
            id: item.id, item: item.name, 
            shelfStock: `${item.remainingStock} ${item.category === 'PACKAGING' ? item.unit : getBaseUnitLabel(item.unit)}`,
            category: item.category
        }));

        const lowStockItems = rawInventory
            .filter(item => item.lowStockThreshold && item.remainingStock <= item.lowStockThreshold)
            .map(item => `${item.name} (Only ${item.remainingStock} ${item.category === 'PACKAGING' ? item.unit : getBaseUnitLabel(item.unit)} left!)`);

        const cleanRecipes = rawRecipes.map(recipe => ({
            cakeName: recipe.name, totalCost: recipe.totalCostPrice,
            ingredientsRequired: recipe.ingredients.map(ing => `${ing.quantity} ${ing.unit} of ${ing.inventory?.name || 'Unknown'}`)
        }));

        const cleanOrders = rawOrders.map(order => ({
            id: order.id, customer: order.customer?.name || "Unknown", status: order.status,
            total: order.grandTotal, items: order.orderItems.map(oi => `${oi.quantity}x ${oi.product?.name}`)
        }));

        // 3. Call Gemini
        const aiResponse = await generateBakingAdvice(query, cleanInventory, lowStockItems, cleanRecipes, cleanOrders);

        // =========================================================
        // 4. ACTION INTERCEPTOR (Executing DB Commands)
        // =========================================================
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = aiResponse.match(jsonRegex);

        let finalResponseText = aiResponse;

        if (match && match[1]) {
            try {
                const parsedAI = JSON.parse(match[1]);
                
                if (parsedAI.action === "UPDATE_ORDER_STATUS" && parsedAI.ordersToUpdate) {
                    try {
                        for (const orderTarget of parsedAI.ordersToUpdate) {
                            const { orderId, newStatus } = orderTarget;

                            const existingOrder = await prisma.order.findFirst({
                                where: { id: orderId, userId: req.userId },
                                include: { orderItems: { include: { product: { include: { ingredients: true } } } } },
                            });

                            if (existingOrder && existingOrder.status !== newStatus) {
                                await prisma.$transaction(async (tx) => {
                                    const oldStatus = existingOrder.status.toUpperCase();
                                    const nextStat = newStatus.toUpperCase();

                                    const wasDeducted = ["ONGOING", "COMPLETED"].includes(oldStatus);
                                    const willBeDeducted = ["ONGOING", "COMPLETED"].includes(nextStat);
                                    const isWastedCancellation = (wasDeducted && nextStat === "CANCELLED");

                                    if (wasDeducted && !isWastedCancellation) {
                                        await restoreInventoryForOrder(existingOrder, tx);
                                    }

                                    const updatedOrder = await tx.order.update({
                                        where: { id: orderId },
                                        data: { status: nextStat },
                                        include: { orderItems: { include: { product: { include: { ingredients: true } } } } }
                                    });

                                    if (willBeDeducted && !wasDeducted) {
                                        await deductInventoryForOrder(updatedOrder, tx);
                                    }
                                }, { timeout: 20000 });
                            }
                        }
                        finalResponseText = parsedAI.replyMessage; 

                    } catch (dbError) {
                        // Catch the specific inventory error message thrown by deductInventoryForOrder
                        const errorMsg = dbError.message || "";
                        if (errorMsg.includes("Insufficient Stock")) {
                            finalResponseText = `I couldn't update that order because you are low on stock. ${errorMsg}`;
                        } else {
                            throw dbError; 
                        }
                    }
                }
            } catch (parseError) {
                console.error("AI Action Parsing Error:", parseError);
                finalResponseText = aiResponse.replace(jsonRegex, "").trim();
            }
        } else {
            finalResponseText = aiResponse.replace(jsonRegex, "").trim(); 
        }

        // =========================================================
        // 5. 🎙️ CONDITIONAL AUDIO GENERATION
        // =========================================================
        let audioBase64 = null;
        if (wantsAudio && finalResponseText) {
            audioBase64 = await generateSpeech(finalResponseText);
        }

        return res.status(200).json({
            message: 'AI response received successfully',
            status: 200,
            data: finalResponseText, 
            audio: audioBase64 
        });

    } catch (error) {
        console.error("AI Controller Error:", error);
        return res.status(500).json({ error: "Something went wrong processing your request." });
    }
};