import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
}

interface OrdersState {
  items: OrderItem[];
}

const initialState: OrdersState = {
  items: [],
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<Omit<OrderItem, 'id'>>) => {
      const id = String(Date.now());
      state.items.push({ id, ...action.payload });
    },
    updateOrder: (state, action: PayloadAction<OrderItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteOrder: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addOrder, updateOrder, deleteOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

