// Loading Spinner component
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = '#0052A3' }) => {
    const sizeMap = {
        small: '20px',
        medium: '40px',
        large: '60px'
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;

    return (
        <div className="spinner-container">
            <div
                className="loading-spinner"
                style={{
                    width: spinnerSize,
                    height: spinnerSize,
                    borderTopColor: color
                }}
            />
        </div>
    );
};

export default LoadingSpinner;
