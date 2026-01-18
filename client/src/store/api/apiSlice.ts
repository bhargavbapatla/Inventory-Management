import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['Ingredients'], // Used for auto-refreshing data
  endpoints: (builder) => ({
    getIngredients: builder.query({
      query: () => '/ingredients',
      providesTags: ['Ingredients'], // Says "This list is cached under 'Ingredients'"
    }),
    addIngredient: builder.mutation({
      query: (newItem) => ({
        url: '/ingredients',
        method: 'POST',
        body: newItem,
      }),
      // ⚡ OPTIMIZATION 3: Auto-Invalidation
      // Tells Redux: "We added an item, so the old 'Ingredients' list is dirty. Refetch it!"
      invalidatesTags: ['Ingredients'], 
    }),
  }),
});

export const { useGetIngredientsQuery, useAddIngredientMutation } = apiSlice;