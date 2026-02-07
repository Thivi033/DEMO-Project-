// Avatar Upload Component
import React, { useState, useRef } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const AvatarUpload = ({
    currentAvatar,
    onUpload,
    onRemove,
    size = 120,
    disabled = false
}) => {
    const [preview, setPreview] = useState(currentAvatar || null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
        }
        if (file.size > MAX_SIZE) {
            return 'File size exceeds 5MB limit.';
        }
        return null;
    };

    const handleFileSelect = (file) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
            if (onUpload) {
                onUpload(file, e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onRemove) {
            onRemove();
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="avatar-upload-container">
            <div
                className={`avatar-upload-area ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
                style={{ width: size, height: size }}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Avatar preview"
                        className="avatar-preview"
                        style={{ width: size, height: size }}
                    />
                ) : (
                    <div className="avatar-placeholder">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">Upload</span>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="avatar-input"
                />
            </div>

            {preview && !disabled && (
                <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={handleRemove}
                >
                    Remove
                </button>
            )}

            {error && <div className="avatar-error">{error}</div>}

            <div className="avatar-help-text">
                JPEG, PNG, GIF or WebP. Max 5MB.
            </div>
        </div>
    );
};

export default AvatarUpload;
