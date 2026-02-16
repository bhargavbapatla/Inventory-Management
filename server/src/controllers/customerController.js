import { prisma } from "../config/db.js";
import pkg from 'express'

const { Request, Response } = pkg;

export const createCustomer = async (req, res) => {
    try {
        const { customer, status, orderItems, orderDate, grandTotal, items } = req.body;
        console.log("customercustomer", customer);
        const {name, phone, address, customerId} = customer;
        let customerResp;
        if (customer.id) {
            customerResp = await prisma.customer.findUnique({
                where: {
                    id: customerId,
                },
            });
        } else {
            customerResp = await prisma.customer.create({
                data: {
                    name,
                    phone,
                    address,
                    email: customer.email,
                    user: req.userId
                        ? {
                              connect: {
                                  id: req.userId,
                              },
                          }
                        : undefined,
                },
            });
        }

        console.log("customerResp", customerResp);

        return res.status(200).json({
        message: 'Customer created successfully',
        status: 200,
        data: customerResp,
    })
    } catch (error) {
        console.log("error", error);
        res.status(400).json({ error: 'Error creating customer' });
    }
}

export const getCustomers = async (req, res) => {   
    try {
        const customers = await prisma.customer.findMany({
            where: {
                userId: req.userId ?? undefined,
            },
        });
        return res.status(200).json({
            message: 'Customers fetched successfully',
            status: 200,
            data: customers,
        });
    } catch (error) {
        return res.status(400).json({
            message: 'Error fetching customers',
            status: 400,
            error: error.message,
        });
    }
}

export const getCustomerById = async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: {
                id: req.params.id,
            },
        });
        res.status(200).json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching customer' });
    }
}

export const updateCustomer = async (req, res) => {
    try {
        const existing = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
            },
        });
        if (!existing || existing.userId !== req.userId) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const customer = await prisma.customer.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
        });
        res.status(200).json(customer); 
    } catch (error) {
        res.status(400).json({ error: 'Error updating customer' });
    }
}

export const deleteCustomer = async (req, res) => {
    try {
        const activeOrder = await prisma.order.findFirst({
            where: {
                customerId: req.params.id,
                status: {
                    in: ["PENDING", "ONGOING"], // Add any statuses that should block deletion
                },
            },
        });

        // 2. If an active order is found, block the deletion
        if (activeOrder) {
            return res.status(400).json({
                message: "Cannot delete this customer because they have active orders in progress.",
                status: 400,
            });
        }

        const existing = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
            },
        });
        if (!existing || existing.userId !== req.userId) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const customer = await prisma.customer.delete({
            where: {
                id: req.params.id,
            },
        });
        res.status(200).json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Error deleting customer' });
    }
}
