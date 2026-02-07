// Session Timeout Hook
import { useState, useEffect, useCallback, useRef } from 'react';

const useSessionTimeout = ({
    sessionDuration = 30 * 60 * 1000,  // 30 minutes default
    warningTime = 5 * 60 * 1000,        // 5 minutes warning
    onSessionExpire,
    onSessionExtend
}) => {
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const sessionTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownRef = useRef(null);

    const clearAllTimers = useCallback(() => {
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    const handleSessionExpire = useCallback(() => {
        clearAllTimers();
        setShowWarning(false);
        if (onSessionExpire) {
            onSessionExpire();
        }
    }, [clearAllTimers, onSessionExpire]);

    const startCountdown = useCallback(() => {
        setRemainingTime(Math.floor(warningTime / 1000));
        countdownRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [warningTime]);

    const startSessionTimer = useCallback(() => {
        clearAllTimers();
        setShowWarning(false);

        // Set warning timer
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            startCountdown();
        }, sessionDuration - warningTime);

        // Set session expiry timer
        sessionTimerRef.current = setTimeout(() => {
            handleSessionExpire();
        }, sessionDuration);
    }, [sessionDuration, warningTime, clearAllTimers, startCountdown, handleSessionExpire]);

    const extendSession = useCallback(() => {
        setShowWarning(false);
        startSessionTimer();
        if (onSessionExtend) {
            onSessionExtend();
        }
    }, [startSessionTimer, onSessionExtend]);

    const logout = useCallback(() => {
        handleSessionExpire();
    }, [handleSessionExpire]);

    // Reset timer on user activity
    const resetTimer = useCallback(() => {
        if (!showWarning) {
            startSessionTimer();
        }
    }, [showWarning, startSessionTimer]);

    useEffect(() => {
        startSessionTimer();

        // Activity listeners
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            clearAllTimers();
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [startSessionTimer, resetTimer, clearAllTimers]);

    return {
        showWarning,
        remainingTime,
        extendSession,
        logout
    };
};

export default useSessionTimeout;
