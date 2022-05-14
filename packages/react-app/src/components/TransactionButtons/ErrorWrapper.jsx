import React from 'react';

export const ErrorWrapper = ({ error, children }) => {
  return error ? (
    <button className={`mt-2 mx-2.5 !py-3 !rounded-[1rem] bg-red-500 text-white ease-in-out duration-300 my-2 disabled:opacity-60`} disabled>
      {error}
    </button>
  ) : (
    <>{children}</>
  );
};
