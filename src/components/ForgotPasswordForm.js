// Forgot password form
import React, { useState } from 'react';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        setSubmitted(true);
    };

    return (
        <div>
            {!submitted ? (
                <form onSubmit={handleSubmit}>
                    <h2>Forgot Password</h2>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                    <button type="submit">Send Reset Link</button>
                </form>
            ) : (
                <p>Check your email for password reset instructions.</p>
            )}
        </div>
    );
};

export default ForgotPasswordForm;
