import { parseEther } from '@ethersproject/units';
import { FixedNumber } from 'ethers';
import { toInteger } from './utils';

const fixNumbers = (...args) => args.map((a) => FixedNumber.from(a));
export class UniswapUtils {
  static quote(amountA, rA, rB) {
    const fAmountA = FixedNumber.from(amountA);
    const fRA = FixedNumber.from(rA);
    const fRB = FixedNumber.from(rB);
    return toInteger(fAmountA.mulUnsafe(fRB).divUnsafe(fRA).floor());
  }

  static getAmmountIn(amountOut, rIn, rOut) {
    const fAmountOut = FixedNumber.from(amountOut);
    const fRIn = FixedNumber.from(rIn);
    const fROut = FixedNumber.from(rOut);
    const numerator = fRIn.mulUnsafe(fAmountOut).mulUnsafe(FixedNumber.from(1000));
    const denominator = fROut.subUnsafe(fAmountOut).mulUnsafe(FixedNumber.from(997));
    return toInteger(numerator.divUnsafe(denominator).ceiling());
  }

  static getAmmountOut(amountIn, rIn, rOut) {
    const fAmountIn = FixedNumber.from(amountIn);
    const fRIn = FixedNumber.from(rIn);
    const fROut = FixedNumber.from(rOut);

    const fAmountInWithFee = fAmountIn.mulUnsafe(FixedNumber.from(997));
    const numerator = fAmountInWithFee.mulUnsafe(fROut);
    const denominator = fRIn.mulUnsafe(FixedNumber.from(1000)).addUnsafe(fAmountInWithFee);
    return toInteger(numerator.divUnsafe(denominator).floor());
  }

  static getRate(r0, r1) {
    return this.getAmmountOut(parseEther('1'), r0, r1);
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
