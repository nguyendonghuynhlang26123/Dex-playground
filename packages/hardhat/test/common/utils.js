const eutils = require("ethereumjs-util");

const sign = async (ethers, address, priv) => {
  const signer = new ethers.Wallet(priv);
  return await signer.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(ethers.utils.solidityPack(["address"], [address]))
    )
  );
};
const truncate = (str, maxDecimalDigits) => {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
const prettyNum = (b, unit, digits = 4) =>
  truncate(ethers.utils.formatUnits(b, unit), digits);
const _18digits = (v) => ethers.utils.parseEther(v.toString());
module.exports = {
  sign,
  prettyNum,
  _18digits,
};
