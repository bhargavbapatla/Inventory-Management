import type { InventoryItem } from '../store/slices/inventorySlice';
import { authorizedAPI } from './api';

import { Inventory } from './paths';


export const getInventory = async () => {
    try {
        const response = await authorizedAPI.get(Inventory);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Inventory fetched successfully' };

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

export const postInventory = async (inventory: InventoryItem) => {
    try {
        const response = await authorizedAPI.post(Inventory, inventory);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Inventory posted successfully' };
    } catch (error: any) {
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error status:", error.response.status);

            return {
                success: false,
                message: error.response.data?.error,
                status: error.response.status
            };
        } else {
            console.error("Network Error:", error.message);
            return { success: false, status: 500, message: "Network Error" };
        }
    }
}

export const editInventory = async (inventory: InventoryItem, id: string) => {
    try {
        const response = await authorizedAPI.put(`${Inventory}/${id}`, inventory);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Inventory edited successfully' };
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

export const deleteInventory = async (id: string) => {
    try {
        const response = await authorizedAPI.delete(`${Inventory}/${id}`);
        return { data: response.data, status: response.status, message: response.data.message || 'Inventory deleted successfully' };
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

export const restockInventory = async (inventory: InventoryItem, id: string) => {
    try {
        const response = await authorizedAPI.put(`${Inventory}/${id}/restock`, inventory);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Inventory restocked successfully' };
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