import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmStyle = 'danger' // 'danger' | 'primary'
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
            <div className="confirm-modal">
                <h2 className="confirm-modal-title">{title}</h2>
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button 
                        className="confirm-modal-btn cancel-btn"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`confirm-modal-btn confirm-btn ${confirmStyle}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
