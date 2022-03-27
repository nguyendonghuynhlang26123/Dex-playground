import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export const TransactionButton = ({ onClick, label, className, state, disabled = false }) => {
  const [isLoading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  useEffect(() => {
    if (!state || state.status === 'None' || state.status === 'Success') {
      setLoading(false);
      return;
    }
    if (state.status === 'Exception') {
      setLoading(false);
      toast.warning(state.errorMessage);
      return;
    }
    setLoading(true);
    if (state.status === 'PendingSignature') setLoadingLabel('Pending');
    else if (state.status === 'Mining') setLoadingLabel('Mining');
    else console.log(state);
  }, [state]);

  return isLoading ? (
    <button
      className={`flex bg-blue-500 text-white hover:bg-blue-300 rounded px-2 py-1.5 opacity-30 ${className}`}
      disabled
    >
      <svg
        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {loadingLabel}
    </button>
  ) : (
    <button
      className={`bg-blue-500 text-white hover:bg-blue-300 ease-in-out duration-300 rounded px-2 py-1.5 ${className} disabled:opacity-40`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
