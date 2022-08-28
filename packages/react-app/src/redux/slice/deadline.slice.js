import { createSlice } from '@reduxjs/toolkit';
import { envConfig } from '../../common/config';

const typeToSecMapper = {
  sec: 1,
  min: 60,
  hour: 60 * 60,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
};

export const deadlineSlice = createSlice({
  name: 'deadline',
  initialState: {
    value: envConfig.deadline,
    type: 'min',
    toSec: 60,
  },
  reducers: {
    updateDeadlineValue: (state, action) => {
      state.value = action.payload;
      return state;
    },
    updateDeadlineType: (state, action) => {
      return {
        ...state,
        type: action.payload,
        toSec: typeToSecMapper[action.payload],
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateDeadlineType, updateDeadlineValue } = deadlineSlice.actions;

export default deadlineSlice.reducer;
