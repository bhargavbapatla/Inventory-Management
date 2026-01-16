import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Unit = 'grams' | 'kgs' | 'pounds';

export interface InventoryItem {
  id: string;
  name: string;
  weight: number;
  unit: Unit;
  quantity: number;
}

interface InventoryState {
  lowStockThreshold: number;
  lastSync: string | null;
  items: InventoryItem[];
}

const initialState: InventoryState = {
  lowStockThreshold: 10,
  lastSync: null,
  items: [],
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setThreshold: (state, action: PayloadAction<number>) => {
      state.lowStockThreshold = action.payload;
    },
    updateSyncTime: (state) => {
      state.lastSync = new Date().toISOString();
    },
    addItem: (state, action: PayloadAction<Omit<InventoryItem, 'id'>>) => {
      const id = String(Date.now());
      state.items.push({ id, ...action.payload });
    },
    updateItem: (state, action: PayloadAction<InventoryItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setThreshold, updateSyncTime, addItem, updateItem, deleteItem } = inventorySlice.actions;
export default inventorySlice.reducer;
