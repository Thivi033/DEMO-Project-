// Toast Notification Component
import React, { useState, useEffect, useCallback } from 'react';

const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

const Toast = ({ id, type, message, duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const getIcon = () => {
        switch (type) {
            case TOAST_TYPES.SUCCESS: return '✓';
            case TOAST_TYPES.ERROR: return '✕';
            case TOAST_TYPES.WARNING: return '⚠';
            case TOAST_TYPES.INFO: return 'ℹ';
            default: return 'ℹ';
        }
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={handleClose}>×</button>
        </div>
    );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

// Toast Hook for managing toast state
const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message, duration = 5000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message, duration) => addToast(TOAST_TYPES.SUCCESS, message, duration), [addToast]);
    const error = useCallback((message, duration) => addToast(TOAST_TYPES.ERROR, message, duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(TOAST_TYPES.WARNING, message, duration), [addToast]);
    const info = useCallback((message, duration) => addToast(TOAST_TYPES.INFO, message, duration), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info
    };
};

export { Toast, ToastContainer, useToast, TOAST_TYPES };
export default ToastContainer;
