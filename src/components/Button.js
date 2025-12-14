// Button component
import React from 'react';

const Button = ({ children, onClick, variant = 'primary' }) => {
    return (
        <button 
            className={`btn btn-${variant}`}
            onClick={onClick}
            style={{ backgroundColor: '#0066cc' }}
        >
            {children}
        </button>
    );
};

export default Button;
