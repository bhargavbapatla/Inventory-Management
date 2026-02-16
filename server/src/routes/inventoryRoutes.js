import express from 'express';
import { createInventory, deleteInventory, getInventory, updateInventory, restockInventory } from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *         - unit
 *         - price
 *         - lowStockThreshold
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the inventory item
 *         name:
 *           type: string
 *           description: The name of the inventory item
 *         quantity:
 *           type: number
 *           description: The quantity of the item in stock
 *         unit:
 *           type: string
 *           enum:
 *             - GRAMS
 *             - KGS
 *             - POUNDS
 *             - LITERS
 *             - PIECES
 *           description: The unit of measurement (e.g., GRAMS, KGS, POUNDS, LITERS, PIECES)
 *         price:
 *           type: number
 *           description: The price per unit
 *         lowStockThreshold:
 *           type: number
 *           description: The quantity at which the item is considered low stock
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the item was added
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the item was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: The inventory managing API
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Returns the list of all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of the inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/',authMiddleware, getInventory);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - unit
 *               - price
 *               - lowStockThreshold
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [GRAMS, KGS, POUNDS, LITERS, PIECES]
 *               price:
 *                 type: number
 *               lowStockThreshold:
 *                 type: number
 *               weight:
 *                 type: number
 *     responses:
 *       200:
 *         description: The created inventory item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/',authMiddleware, createInventory);

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update an inventory item by id
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The inventory item id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               lowStockThreshold:
 *                 type: number
 *               weight:
 *                 type: number
 *     responses:
 *       200:
 *         description: The updated inventory item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: The inventory item was not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id',authMiddleware, updateInventory);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Remove an inventory item by id
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The inventory item id
 *     responses:
 *       200:
 *         description: The inventory item was deleted
 *       404:
 *         description: The inventory item was not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id',authMiddleware, deleteInventory);
router.put('/:id/restock', authMiddleware, restockInventory);
export default router;
