import { authorizedAPI } from './api';
import { Product } from './paths';
import type { RecipeItem } from '../store/slices/recipesSlice';

// Assuming Product maps to RecipeItem based on context
type ProductItem = RecipeItem;

export const getProducts = async () => {
    try {
        const response = await authorizedAPI.get(Product);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Products fetched successfully' };

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

export const getProductById = async (id: string) => {
    try {
        const response = await authorizedAPI.get(`${Product}/${id}`);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Product fetched successfully' };
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
export const postProductData = async (product: ProductItem) => {
    try {
        const response = await authorizedAPI.post(Product, product);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Product posted successfully' };
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

export const updateProductsbyId = async (product: ProductItem, id: string) => {
    try {
        const response = await authorizedAPI.put(`${Product}/${id}`, product);
        return { data: response.data.data, status: response.status, message: response.data.message || 'Product updated successfully' };
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

export const deleteProductById = async (id: string) => {
    try {
        const response = await authorizedAPI.delete(`${Product}/${id}`);
        return { data: response.data, status: response.status, message: response.data.message || 'Product deleted successfully' };
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
