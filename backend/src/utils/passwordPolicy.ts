export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  details?: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const details = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password)
  };

  const allValid = Object.values(details).every(Boolean);

  if (allValid) {
    return { valid: true, message: '密码符合要求', details };
  }

  const missing: string[] = [];
  if (!details.minLength) missing.push('at least 8 characters');
  if (!details.uppercase) missing.push('an uppercase letter');
  if (!details.lowercase) missing.push('a lowercase letter');
  if (!details.number) missing.push('a number');
  if (!details.special) missing.push('a special character (!@#$%^&*...)');

  return {
    valid: false,
    message: `Password is too weak. It must contain: ${missing.join(', ')}`,
    details
  };
}
