import React from 'react';
import ReactTooltip from 'react-tooltip';

export const TooltipWrap = ({ children, tip }) => {
  const tipRef = React.createRef(null);
  function handleMouseEnter() {
    tipRef.current.style.opacity = 1;
    tipRef.current.style.visibility = 'visible';
  }
  function handleMouseLeave() {
    tipRef.current.style.opacity = 0;
    tipRef.current.style.visibility = 'hidden';
  }

  return (
    <div className="relative flex items-center">
      <div
        className="absolute whitespace-normal min-w-fit text-sm bg-gradient-to-t w-auto from-sky-700 to-blue-800 text-white px-4 py-2 rounded flex items-center transition-all duration-200"
        style={{ bottom: '150%', opacity: 0, visibility: 'hidden', left: '50%', right: '50%', translate: '-50%' }}
        ref={tipRef}
      >
        <div className="bg-sky-700 h-3 w-3 absolute" style={{ bottom: '-6px', transform: 'rotate(45deg)', left: '50%', right: '50%', translate: '-50%' }} />
        {tip}
      </div>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </div>
    </div>
  );
};
