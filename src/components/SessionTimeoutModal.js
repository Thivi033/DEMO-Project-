// Session Timeout Warning Modal Component
import React from 'react';

const SessionTimeoutModal = ({
    isVisible,
    remainingTime,
    onExtendSession,
    onLogout
}) => {
    if (!isVisible) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="session-timeout-overlay">
            <div className="session-timeout-modal">
                <div className="modal-header">
                    <h2>Session Expiring Soon</h2>
                </div>
                <div className="modal-body">
                    <p>Your session will expire in:</p>
                    <div className="countdown-timer">
                        {formatTime(remainingTime)}
                    </div>
                    <p>Would you like to extend your session?</p>
                </div>
                <div className="modal-footer">
                    <button
                        className="btn btn-primary"
                        onClick={onExtendSession}
                    >
                        Stay Logged In
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onLogout}
                    >
                        Logout Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
