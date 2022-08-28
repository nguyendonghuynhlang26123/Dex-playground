import { configureStore } from '@reduxjs/toolkit';
import deadlineReducer from './redux/slice/deadline.slice';
import slippageReducer from './redux/slice/slippage.slice';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tokenListApi } from './redux/api';

const store = configureStore({
  reducer: {
    deadline: deadlineReducer,
    slippage: slippageReducer,
    [tokenListApi.reducerPath]: tokenListApi.reducer,
  },

  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(tokenListApi.middleware),
});

// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

export default store;
