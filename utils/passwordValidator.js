/**
 * Password validation and generation utilities
 */

/**
 * Validates a password against several security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (non-alphanumeric, non-whitespace)
 * 
 * @param {string} password The password to validate
 * @returns {string[]} Array of unmet requirements, empty if valid
 */
export function validatePassword(password) {
  const errors = [];
  if (!password) {
    return ["Password is required"];
  }
  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("one number");
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    errors.push("one special character");
  }
  return errors;
}

/**
 * Generates a random secure temporary password that is guaranteed to fulfill all requirements.
 * 
 * @returns {string} Compliant secure password
 */
export function generateCompliantPassword() {
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  // Guarantee at least one of each required character category
  let pwd = "";
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  
  // Add 8 more characters from all sets to ensure it's length 12
  const all = uppers + lowers + numbers + specials;
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle characters to avoid predictable patterns
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}
