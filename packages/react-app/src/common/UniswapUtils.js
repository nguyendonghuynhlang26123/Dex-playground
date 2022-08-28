import { parseUnits } from '@ethersproject/units';
import { BigNumber, FixedNumber } from 'ethers';
import { toInteger } from './utils';

const fixNumbers = (...args) => args.map((a) => FixedNumber.from(a));
const _997 = BigNumber.from(997);
const _1000 = BigNumber.from(1000);
export class UniswapUtils {
  static quote(amountA, rA, rB) {
    const fAmountA = FixedNumber.from(amountA);
    const fRA = FixedNumber.from(rA);
    const fRB = FixedNumber.from(rB);
    return toInteger(fAmountA.mulUnsafe(fRB).divUnsafe(fRA).floor());
  }

  static getAmountIn(amountOut, rIn, rOut) {
    // const fAmountOut = FixedNumber.from(amountOut);
    // const fRIn = FixedNumber.from(rIn);
    // const fROut = FixedNumber.from(rOut);
    // const numerator = fRIn.mulUnsafe(fAmountOut).mulUnsafe(FixedNumber.from(1000));
    // const denominator = fROut.subUnsafe(fAmountOut).mulUnsafe(FixedNumber.from(997));
    // return toInteger(numerator.divUnsafe(denominator).ceiling());

    const numerator = rIn.mul(amountOut).mul(_1000);
    const denominator = rOut.sub(amountOut).mul(_997);
    return numerator.div(denominator).toString();
  }

  static getAmountOut(amountIn, rIn, rOut) {
    // const fAmountIn = FixedNumber.from(amountIn);
    // const fRIn = FixedNumber.from(rIn);
    // const fROut = FixedNumber.from(rOut);

    // const fAmountInWithFee = fAmountIn.mulUnsafe(FixedNumber.from(997));
    // const numerator = fAmountInWithFee.mulUnsafe(fROut);
    // const denominator = fRIn.mulUnsafe(FixedNumber.from(1000)).addUnsafe(fAmountInWithFee);
    // return toInteger(numerator.divUnsafe(denominator).floor());

    const amountInWithFee = amountIn.mul(_997);
    const numerator = amountInWithFee.mul(rOut);
    const denominator = rIn.mul(_1000).add(amountInWithFee);
    console.log(numerator.div(denominator).toString());
    return numerator.div(denominator).toString();
  }

  // return v1/v0
  static getRate(v0, v1) {
    const [fV0, fV1] = fixNumbers(v0, v1);
    if (!fV0.isZero()) return fV1.divUnsafe(fV0);
    else throw new Error('UniswapUtils.getRate exception. Divide by 0');
  }

  // return v1*1unit/v0
  static getPriceRate(v0, v1, units = 18) {
    if (!v0._isBigNumber || !v1._isBigNumber) {
      v0 = BigNumber.from(v0.toString());
      v1 = BigNumber.from(v1.toString());
    }
    if (!v0.isZero()) return v1.mul(parseUnits('1', units)).div(v0);
    else throw new Error('UniswapUtils.getRate exception. Divide by 0');
  }

  static calculatePriceImpact(inputPrice, outputPrice, reserve0, reserve1) {
    const [fInput, fOutput, fR0, fR1] = fixNumbers(inputPrice, outputPrice, reserve0, reserve1);
    const newR0 = fR0.addUnsafe(fInput);
    const newR1 = fR1.subUnsafe(fOutput);

    if (newR0 < 0 || newR1 < 0) {
      console.warn('Invalid input/output price that lead to negative reserve');
      return FixedNumber.from(100);
    }
    const currentRate = this.getRate(reserve0, reserve1);
    const newRate = this.getRate(newR0, newR1);
    const impacted = FixedNumber.from(newRate).divUnsafe(FixedNumber.from(currentRate));
    return FixedNumber.from(1).subUnsafe(impacted).mulUnsafe(FixedNumber.from(100));
  }

  static liquidityCanMint(deposit, reserve, totalLiquidity) {
    const [fDeposit, fR, fSupply] = fixNumbers(deposit, reserve, totalLiquidity);
    const toBeMinted = fSupply.mulUnsafe(fDeposit.divUnsafe(fR));
    return toInteger(toBeMinted);
  }

  static percentShareExpect(deposit, reserve, totalLiquidity) {
    const canMint = this.liquidityCanMint(deposit, reserve, totalLiquidity);
    const [fMinted, fSupply] = fixNumbers(canMint, totalLiquidity);
    return fMinted.mulUnsafe(FixedNumber.from(100)).divUnsafe(fSupply.addUnsafe(fMinted));
  }
}
