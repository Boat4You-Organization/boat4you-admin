export const sortByNumericProp =
  <T>(prop: keyof T) =>
  (a: T, b: T) =>
    (a[prop] as number) - (b[prop] as number);
