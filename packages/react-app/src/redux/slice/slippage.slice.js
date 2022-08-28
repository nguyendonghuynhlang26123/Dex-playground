import { createSlice } from '@reduxjs/toolkit';
import { envConfig } from '../../common/config';

export const slippageSlice = createSlice({
  name: 'slippage',
  initialState: {
    value: envConfig.slippage,
  },
  reducers: {
    updateSlippage: (state, action) => {
      console.log('log ~ file: slippage.slice.js ~ line 11 ~ action', action.payload);
      return {
        value: action.payload,
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateSlippage } = slippageSlice.actions;

export default slippageSlice.reducer;
