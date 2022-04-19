import { configureStore } from '@reduxjs/toolkit';
import deadlineReducer from './redux/deadline.slice';
import slippageReducer from './redux/slippage.slice';

export default configureStore({
  reducer: {
    deadline: deadlineReducer,
    slippage: slippageReducer,
  },
});
