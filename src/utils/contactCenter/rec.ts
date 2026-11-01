/* Session recording settings (P6 R1.6). No runtime imports: `yarn test` runs this file with Node's own type stripping. */

/** A recorded share: a whole number of percent from 0 to 100 (the backend refuses anything else). */
export const pctOk = (v: number): boolean => Number.isInteger(v) && v >= 0 && v <= 100;
