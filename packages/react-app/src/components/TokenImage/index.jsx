import React from 'react';
import TokenIcon from '../../assets/images/token.png';

export const TokenImage = ({ image, ...props }) => {
  return (
    <img
      src={image}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = TokenIcon;
      }}
      {...props}
    />
  );
};
