import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import inventoryReducer from './slices/inventorySlice';
import recipesReducer from './slices/recipesSlice';
import { apiSlice } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    recipes: recipesReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
