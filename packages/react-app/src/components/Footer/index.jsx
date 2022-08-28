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
      <a href="https://polygonscan.com/address/0x0Ea72B2D4B07c06b372296f9C1cb8E0231d06703#code" className="cursor-pointer hover:text-sky-200">
        Contract
      </a>
      <a href="https://t.me/+qGlRvvFup9AzMWFl" className="cursor-pointer hover:text-sky-200">
        Telegram
      </a>
    </footer>
  );
};
