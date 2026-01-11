import React, { useState } from 'react';

/**
 * Social Login Buttons Component
 * Provides OAuth login options for Google and GitHub
 */
const SocialLoginButtons = ({
    onSuccess,
    onError,
    disabled = false,
    size = 'medium',
    showLabels = true,
    layout = 'vertical'
}) => {
    const [loading, setLoading] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const providers = [
        {
            id: 'google',
            name: 'Google',
            icon: GoogleIcon,
            bgColor: '#ffffff',
            textColor: '#757575',
            borderColor: '#dadce0',
            hoverBgColor: '#f8f9fa'
        },
        {
            id: 'github',
            name: 'GitHub',
            icon: GitHubIcon,
            bgColor: '#24292e',
            textColor: '#ffffff',
            borderColor: '#24292e',
            hoverBgColor: '#2f363d'
        }
    ];

    const sizeStyles = {
        small: { padding: '8px 16px', fontSize: '14px', iconSize: 18 },
        medium: { padding: '12px 24px', fontSize: '16px', iconSize: 20 },
        large: { padding: '16px 32px', fontSize: '18px', iconSize: 24 }
    };

    const handleOAuthLogin = (providerId) => {
        if (disabled || loading) return;

        setLoading(providerId);

        // Open OAuth popup or redirect
        const authUrl = `${API_BASE_URL}/api/auth/${providerId}`;

        // Option 1: Full page redirect
        window.location.href = authUrl;

        // Option 2: Popup window (uncomment to use)
        // openOAuthPopup(authUrl, providerId);
    };

    const openOAuthPopup = (url, providerId) => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            url,
            `${providerId}_oauth`,
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback message
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'oauth_callback') {
                window.removeEventListener('message', handleMessage);
                setLoading(null);

                if (event.data.success) {
                    onSuccess?.(event.data);
                } else {
                    onError?.(event.data.error || 'Authentication failed');
                }

                popup?.close();
            }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was blocked
        if (!popup || popup.closed) {
            setLoading(null);
            onError?.('Popup was blocked. Please allow popups and try again.');
        }

        // Poll to check if popup was closed manually
        const pollTimer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(pollTimer);
                window.removeEventListener('message', handleMessage);
                setLoading(null);
            }
        }, 500);
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        gap: '12px',
        width: '100%'
    };

    const buttonStyle = (provider) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: sizeStyles[size].padding,
        fontSize: sizeStyles[size].fontSize,
        fontWeight: 500,
        backgroundColor: provider.bgColor,
        color: provider.textColor,
        border: `1px solid ${provider.borderColor}`,
        borderRadius: '8px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || (loading && loading !== provider.id) ? 0.6 : 1,
        transition: 'all 0.2s ease',
        width: layout === 'vertical' ? '100%' : 'auto',
        flex: layout === 'horizontal' ? 1 : 'none'
    });

    return (
        <div style={containerStyle}>
            {providers.map((provider) => (
                <button
                    key={provider.id}
                    onClick={() => handleOAuthLogin(provider.id)}
                    disabled={disabled || loading}
                    style={buttonStyle(provider)}
                    onMouseEnter={(e) => {
                        if (!disabled && !loading) {
                            e.target.style.backgroundColor = provider.hoverBgColor;
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = provider.bgColor;
                    }}
                >
                    <provider.icon size={sizeStyles[size].iconSize} />
                    {showLabels && (
                        <span>
                            {loading === provider.id
                                ? 'Connecting...'
                                : `Continue with ${provider.name}`}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

// Google Icon Component
const GoogleIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

// GitHub Icon Component
const GitHubIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

export default SocialLoginButtons;
