// Reset password form
import React, { useState } from 'react';

const ResetPasswordForm = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: password })
        });

        if (response.ok) {
            setSuccess(true);
        }
    };

    return (
        <div>
            {!success ? (
                <form onSubmit={handleSubmit}>
                    <h2>Reset Password</h2>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    {error && <span>{error}</span>}
                    <button type="submit">Reset Password</button>
                </form>
            ) : (
                <p>Password reset successful!</p>
            )}
        </div>
    );
};

export default ResetPasswordForm;
