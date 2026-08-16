import { describe, it, expect } from 'vitest';
import { validatePassword, generateCompliantPassword } from '../../utils/passwordValidator.js';

describe('Unit Tests: Password Validator', () => {
  it('should return an error if password is empty or null', () => {
    expect(validatePassword('')).toEqual(['Password is required']);
    expect(validatePassword(null)).toEqual(['Password is required']);
    expect(validatePassword(undefined)).toEqual(['Password is required']);
  });

  it('should detect passwords under 8 characters', () => {
    const errors = validatePassword('Short1!');
    expect(errors).toContain('at least 8 characters');
  });

  it('should detect missing uppercase letter', () => {
    const errors = validatePassword('lowercase1!');
    expect(errors).toContain('one uppercase letter');
  });

  it('should detect missing lowercase letter', () => {
    const errors = validatePassword('UPPERCASE1!');
    expect(errors).toContain('one lowercase letter');
  });

  it('should detect missing number', () => {
    const errors = validatePassword('NoNumbers!');
    expect(errors).toContain('one number');
  });

  it('should detect missing special character', () => {
    const errors = validatePassword('NoSpecial123');
    expect(errors).toContain('one special character');
  });

  it('should return empty array for valid compliant password', () => {
    const errors = validatePassword('SecurePass123!');
    expect(errors).toEqual([]);
  });

  it('should generate a password that satisfies all validation criteria', () => {
    for (let i = 0; i < 20; i++) {
      const generated = generateCompliantPassword();
      const errors = validatePassword(generated);
      expect(errors).toEqual([]);
      expect(generated.length).toBeGreaterThanOrEqual(8);
    }
  });
});
