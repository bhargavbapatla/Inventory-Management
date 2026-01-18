import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Unit } from './inventorySlice';

export interface RecipeIngredient {
  id: string;
  inventoryId: string | null;
  quantityNeeded: number;
  unit: Unit;
}

export interface RecipeItem {
  id: string;
  name: string;
  sellingPrice: number;
  description: string;
  ingredients: RecipeIngredient[];
}

interface RecipesState {
  items: RecipeItem[];
}

const initialState: RecipesState = {
  items: [],
};

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    addRecipe: (state, action: PayloadAction<Omit<RecipeItem, 'id'>>) => {
      const id = String(Date.now());
      state.items.push({ id, ...action.payload });
    },
    updateRecipe: (state, action: PayloadAction<RecipeItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteRecipe: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addRecipe, updateRecipe, deleteRecipe } = recipesSlice.actions;
export default recipesSlice.reducer;

