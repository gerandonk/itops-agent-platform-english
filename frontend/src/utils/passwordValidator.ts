export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  details: {
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
    special: /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password),
  };

  const allValid = Object.values(details).every(Boolean);

  if (allValid) {
    return { valid: true, message: 'Password meets requirements', details };
  }

  const missing: string[] = [];
  if (!details.minLength) missing.push('At least 8 characters');
  if (!details.uppercase) missing.push('Uppercase letter');
  if (!details.lowercase) missing.push('Lowercase letter');
  if (!details.number) missing.push('Digit');
  if (!details.special) missing.push('Special characters (!@#$%^&*...)');

  return {
    valid: false,
    message: `Password complexity insufficient; must include: ${missing.join('、')}`,
    details,
  };
}

export function getPasswordStrength(password: string): {
  level: 'weak' | 'medium' | 'strong';
  score: number;
  label: string;
  color: string;
} {
  const validation = validatePassword(password);
  const score = Object.values(validation.details).filter(Boolean).length;

  if (score <= 2) {
    return { level: 'weak', score, label: 'Weak', color: 'text-status-failed' };
  } else if (score <= 3) {
    return { level: 'medium', score, label: 'Medium', color: 'text-yellow-500' };
  } else {
    return { level: 'strong', score, label: 'Strong', color: 'text-status-success' };
  }
}
