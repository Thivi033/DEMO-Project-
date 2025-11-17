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

module.exports = { validateEmail, validatePassword };
