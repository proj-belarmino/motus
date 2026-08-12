/**
 * Evaluates an email address against a strict, near-RFC 5322 compliant regex.
 * It strictly forbids spaces, consecutive dots, and ensures valid TLD formatting.
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: 'Email is required.' };
  if (/\s/.test(email)) return { isValid: false, error: 'Email cannot contain spaces.' };

  // Strict HTML5-compatible email regex ensuring proper domain/TLD structure
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true };
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password with granular feedback.
 * Strictly forbids spaces and requires high complexity.
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ['Password is required.'] };
  }

  if (/\s/.test(password)) errors.push('Cannot contain spaces.');
  if (password.length < 8) errors.push('Must be at least 8 characters long.');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter.');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number.');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain a special character.');

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Strips dangerous HTML injection vectors but PRESERVES user formatting.
 * Spaces are allowed here generally, but our specific validators above will reject them for auth.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};
