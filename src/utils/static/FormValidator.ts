import Validator from 'validator';

export const acceptedMimeTypes = '.pdf,application/pdf,image/heic,image/png,image/jpg,image/jpeg';

export const acceptedImageTypes = 'image/heic,image/png,image/jpg,image/jpeg,image/webp';

export const acceptedPDFTypes = '.pdf,application/pdf';

type ValidationFn<T = string> = (value?: T) => string | true;

export class FormValidator {
  public static all<T = string>(...validationFns: ValidationFn<T>[]): ValidationFn<T> {
    return value => {
      const errors = validationFns.map(fn => fn(value));

      return errors.find(e => e !== true) || true;
    };
  }

  public static skipValidation: ValidationFn = () => true;

  public static isNotEmpty: ValidationFn = value => {
    if (value === null || value === undefined || value === '') return 'Required';

    if (typeof value === 'number') return true;

    return Validator.isEmpty(String(value)) ? 'Required' : true;
  };

  public static isNumberRequired: ValidationFn<string | number | null | undefined> = value => {
    const isEmpty = value === null || value === undefined || value === '';

    if (isEmpty) return 'Required';

    const num = Number(value);

    return isNaN(num) ? 'Must be a valid number' : true;
  };

  public static isNumberOptional: ValidationFn<string | number | null | undefined> = value => {
    const isEmpty = value === null || value === undefined || value === '';

    if (isEmpty) return true;

    const num = Number(value);

    return isNaN(num) ? 'Must be a valid number' : true;
  };

  public static isValidEmail: ValidationFn = value => (Validator.isEmail(value || '') ? true : 'Invalid email address');

  public static isMinimum: ValidationFn<number> = value => (value !== undefined && value > 0) || 'Minimum is 1';

  public static isWholeNumber: ValidationFn = value => {
    const num = String(value);

    return /^\d+$/.test(num || '') ? true : 'Must be a whole number';
  };

  public static matchesPassword =
    (passwordValue: string): ValidationFn =>
    (value?: string) => {
      if (!value) return 'Required';

      return value === passwordValue ? true : 'Passwords do not match';
    };
}
