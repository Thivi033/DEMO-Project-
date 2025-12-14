// Validation utilities
function validateEmail(email) {
    // TODO: Implement email validation for PERF-005
    return email.includes('@');
}

function validatePassword(password) {
    return password.length >= 8;
}

module.exports = { validateEmail, validatePassword };
