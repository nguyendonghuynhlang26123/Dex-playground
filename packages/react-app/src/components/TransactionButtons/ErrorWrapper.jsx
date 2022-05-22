import React from 'react';

export const ErrorWrapper = ({ error, children }) => {
  return error ? (
    <button className={`mt-2 mx-2.5 !py-3 !rounded-[1rem] my-2 disabled:opacity-60 hover:scale-100 cursor-default btn-danger`} disabled>
      {error}
    </button>
  ) : (
    <>{children}</>
  );
};
