import { isValidEmail } from '@/utils/validators/emailValidator';

export const authValidators = {
  isValidEmail,
  isValidPassword: (password: string, email?: string): boolean => {
    if (!password || password.length < 10 || password.length > 72) return false;
    if (email && password.toLowerCase() === email.toLowerCase()) return false;
    return true;
  },
};
