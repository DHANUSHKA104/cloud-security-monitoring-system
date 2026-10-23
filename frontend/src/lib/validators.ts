export const validators = {
  required: (value: unknown): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },
  minLength: (value: string, min: number): boolean => {
    return (value || '').length >= min;
  },
  maxLength: (value: string, max: number): boolean => {
    return (value || '').length <= max;
  },
  matches: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },
};
