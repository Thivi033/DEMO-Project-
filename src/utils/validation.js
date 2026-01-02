// Validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return { valid: false, error: "Email is required" };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, error: "Invalid email format" };
    }

    return { valid: true, error: null };
}

function validatePassword(password) {
    return password.length >= 8;
}

/**
 * Validates password strength based on security requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with strength level and details
 */
function validatePasswordStrength(password) {
    const result = {
        valid: false,
        strength: 'weak',
        score: 0,
        errors: [],
        requirements: {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumber: false,
            hasSpecialChar: false
        }
    };

    if (!password || typeof password !== 'string') {
        result.errors.push('Password is required');
        return result;
    }

    // Check minimum length (8 characters)
    if (password.length >= 8) {
        result.requirements.minLength = true;
        result.score += 1;
    } else {
        result.errors.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letter
    if (/[A-Z]/.test(password)) {
        result.requirements.hasUppercase = true;
        result.score += 1;
    } else {
        result.errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (/[a-z]/.test(password)) {
        result.requirements.hasLowercase = true;
        result.score += 1;
    } else {
        result.errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (/[0-9]/.test(password)) {
        result.requirements.hasNumber = true;
        result.score += 1;
    } else {
        result.errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        result.requirements.hasSpecialChar = true;
        result.score += 1;
    } else {
        result.errors.push('Password must contain at least one special character');
    }

    // Determine strength level based on score
    if (result.score === 5) {
        result.strength = 'strong';
        result.valid = true;
    } else if (result.score >= 3) {
        result.strength = 'medium';
        result.valid = false;
    } else {
        result.strength = 'weak';
        result.valid = false;
    }

    return result;
}

module.exports = { validateEmail, validatePassword, validatePasswordStrength };
