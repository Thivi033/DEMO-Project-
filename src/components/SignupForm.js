// Signup form component
import React, { useState } from 'react';
import { validateEmail } from '../utils/validation';

const SignupForm = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const validation = validateEmail(email);
        
        if (!validation.valid) {
            setError(validation.error);
            return;
        }
        
        console.log('Valid email:', email);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
            />
            {error && <span className="error">{error}</span>}
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default SignupForm;
