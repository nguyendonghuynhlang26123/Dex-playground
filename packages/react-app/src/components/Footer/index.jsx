import React from 'react';

export const Footer = () => {
  return (
    <footer id="footer" className="flex flex-row items-center justify-center gap-4 text-md  text-sky-100 tracking-tight h-12 border-t border-sky-100">
      <a href="#" className="cursor-pointer hover:text-sky-200">
        About
      </a>
      <a href="https://github.com/nguyendonghuynhlang26123/Dex-playground" className="cursor-pointer hover:text-sky-200">
        Code
      </a>
      <a href="https://rinkeby.etherscan.io/address/0xa9cd06edf421373f7dd86fb26268c7995a872327" className="cursor-pointer hover:text-sky-200">
        Contract
      </a>
      <a href="https://t.me/+qGlRvvFup9AzMWFl" className="cursor-pointer hover:text-sky-200">
        Telegram
      </a>
    </footer>
  );
};
