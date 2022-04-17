import { FixedNumber } from 'ethers';
import { toInteger } from './utils';

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
}
