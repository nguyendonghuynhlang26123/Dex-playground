import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateDeadlineType, updateDeadlineValue, updateSlippage } from '../../redux';

export const SwapConfig = () => {
  const dispatch = useDispatch();
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, type } = useSelector((state) => state.deadline);

  const onChangeSlippage = (ev) => {
    dispatch(updateSlippage(ev.target.value));
  };
  const onChangeDeadline = (ev) => dispatch(updateDeadlineValue(ev.target.value));
  const onChangeTimeType = (ev) => dispatch(updateDeadlineType(ev.target.value));

  return (
    <p className="my-2 text-center">
      Slippage:{' '}
      <input
        className="inline w-16 border-b border-gray-400 focus:outline-none text-right"
        onChange={onChangeSlippage}
        type="number"
        value={slippage}
      />
      % - Deadline:{' '}
      <input
        className="inline w-16 border-b border-gray-400 focus:outline-none text-right"
        type="number"
        onChange={onChangeDeadline}
        value={deadline}
      />
      <select
        value={type}
        className="inline mx-2 py-1 rounded cursor-pointer hover:bg-gray-300"
        onChange={onChangeTimeType}
      >
        <option value="sec">seconds</option>
        <option value="min">minutes</option>
        <option value="hour">hours</option>
        <option value="day">days</option>
        <option value="week">weeks</option>
      </select>
    </p>
  );
};
