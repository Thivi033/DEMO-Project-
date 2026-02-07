// Password Input Component with Visibility Toggle
import React, { useState } from 'react';

const PasswordInput = ({
    id,
    name,
    value,
    onChange,
    placeholder = 'Enter password',
    className = '',
    label,
    error,
    required = false,
    disabled = false,
    autoComplete = 'current-password'
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className={`password-input-wrapper ${className}`}>
            {label && (
                <label htmlFor={id} className="password-input-label">
                    {label}
                    {required && <span className="required-asterisk">*</span>}
                </label>
            )}
            <div className="password-input-container">
                <input
                    type={showPassword ? 'text' : 'password'}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`password-input ${error ? 'password-input-error' : ''}`}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={toggleVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={disabled}
                >
                    {showPassword ? (
                        <span className="eye-icon">👁️</span>
                    ) : (
                        <span className="eye-icon">👁️‍🗨️</span>
                    )}
                </button>
            </div>
            {error && <span className="password-input-error-text">{error}</span>}
        </div>
    );
};

export default PasswordInput;
