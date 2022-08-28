import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define a service using a base URL and expected endpoints
export const tokenListApi = createApi({
  reducerPath: 'tokenApi',
  endpoints: (builder) => ({
    getTokens: builder.query({
      query: 'https://raw.githubusercontent.com/nguyendonghuynhlang26123/Dex-playground/master/packages/assets/tokens.json/',
      transformResponse: (response) => response.tokens,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetTokens } = tokenListApi;
