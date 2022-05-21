import React, { useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../Modal';
import { updateDeadlineType, updateDeadlineValue, updateSlippage } from '../../redux';
import { RadioGroup } from '@headlessui/react';

export const ConfigButton = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, type } = useSelector((state) => state.deadline);

  const onChangeSlippage = (ev) => {
    dispatch(updateSlippage(ev.target.value));
  };
  const onSelectSlippage = (value) => dispatch(updateSlippage(value));
  const onChangeDeadline = (ev) => dispatch(updateDeadlineValue(ev.target.value));
  const onChangeTimeType = (ev) => dispatch(updateDeadlineType(ev.target.value));

  const slippageOptions = ['0.1', '0.5', '1'];

  return (
    <>
      <button onClick={() => setOpen(true)} className=" btn-primary font-bold w-8 h-8 flex items-center justify-center">
        <FiSettings />
      </button>
      <Modal isOpen={open} closeModal={() => setOpen(false)} title="Transaction setting">
        <div className="w-64">
          <p className="my-2">
            <p className="py-1">Slippage tolerance:</p>
            <div className="flex flex-row items-center">
              <RadioGroup value={slippage} onChange={onSelectSlippage} className="flex flex-row items-center gap-1 pb-1">
                {slippageOptions.map((v) => (
                  <RadioGroup.Option value={v} key={v} className="focus:outline-none">
                    {({ checked }) => (
                      <span
                        className={`outline-none rounded-full text-center px-2 py-0.5 cursor-pointer hover:bg-blue-100 ${
                          checked ? 'bg-blue-500 text-white' : ''
                        }`}
                      >
                        {v}%
                      </span>
                    )}
                  </RadioGroup.Option>
                ))}
                <div>
                  <input
                    className="inline ml-2 w-20 pl-2 pr-4 border-2 rounded-full  border-gray-400 focus:outline-none focus:border-blue-500"
                    onChange={onChangeSlippage}
                    type="number"
                    value={slippage}
                  />
                  <span className="-ml-6 ">%</span>
                </div>
              </RadioGroup>
            </div>
            <div className="flex flex-row items-center py-1">
              <p className="py-1">Deadline:</p>
              <select value={type} className="inline mx-2 py-1 rounded cursor-pointer hover:bg-gray-300" onChange={onChangeTimeType}>
                <option value="sec">secs</option>
                <option value="min">mins</option>
                <option value="hour">hours</option>
                <option value="day">days</option>
                <option value="week">weeks</option>
              </select>
              <input
                className="inline ml-2 w-20 pl-2 pr-4 border-2 rounded-full text-gray-600 border-gray-400 focus:outline-none focus:border-blue-500"
                type="number"
                onChange={onChangeDeadline}
                value={deadline}
              />
            </div>
          </p>
        </div>
      </Modal>
    </>
  );
};
