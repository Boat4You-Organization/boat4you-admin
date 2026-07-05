/**
 * Whole-euro split of the reservation-level bank-transfer fee
 * (BANK_TRANSFER_FIXED_FEE, e.g. 32 EUR) across the reservation's payment
 * phases; earlier phases absorb the remainder (32 across 3 → 11/11/10, shares
 * always sum to the fee). Mirrors backend BankTransferFeeShare and the same
 * util in boat4you-web exactly, so the admin shows the same wire amounts the
 * emails ask the customer for.
 */
export const bankFeeShareForPhase = (totalFee: number, phaseCount: number, phaseIndex: number): number => {
  const fee = Math.round(totalFee);

  if (fee <= 0) return 0;

  const n = phaseCount > 0 ? phaseCount : 1;
  const idx = Math.min(Math.max(phaseIndex, 0), n - 1);
  const base = Math.floor(fee / n);
  const remainder = fee - base * n;

  return base + (idx < remainder ? 1 : 0);
};
