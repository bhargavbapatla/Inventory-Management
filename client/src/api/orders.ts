import { authorizedAPI } from './api';
import { orders } from './paths';
import type { OrderStatus } from '../store/slices/ordersSlice';

interface OrderPayload {
  customer: {
    customerId: string | null;
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    sellingPrice: number;
  }>;
  grandTotal: number;
  orderDate: string;
  status: OrderStatus;
}

export const getOrders = async () => {
    try {
        const response = await authorizedAPI.get(orders);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Orders fetched successfully' };

    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data.message,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}

export const getOrderById = async (id: string) => {
    try {
        const response = await authorizedAPI.get(`${orders}/${id}`);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Order fetched successfully' };
    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data.message,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}
export const createOrder = async (order: OrderPayload) => {
    try {
        const response = await authorizedAPI.post(orders, order);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Order posted successfully' };
    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data?.message,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}

export const updateOrderById = async (order: OrderPayload, id: string) => {
    try {
        const response = await authorizedAPI.put(`${orders}/${id}`, order);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Order updated successfully' };
    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data.message,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}

export const deleteOrderById = async (id: string) => {
    try {
        const response = await authorizedAPI.delete(`${orders}/${id}`);
        return { data: response.data, status: response.status, message: response.data.message || 'Order deleted successfully'};
    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data.message,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}
