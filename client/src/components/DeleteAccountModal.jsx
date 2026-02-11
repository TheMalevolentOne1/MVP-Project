import React, { useState } from 'react';
import './DeleteAccountModal.css';

const DeleteAccountModal = ({ isOpen, onConfirm, onCancel, userEmail }) => {
    const [step, setStep] = useState(1);
    const [emailInput, setEmailInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        setStep(1);
        setEmailInput('');
        setError('');
        onCancel();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        
        if (emailInput !== userEmail) {
            setError('Email does not match. Please try again.');
            return;
        }
        
        setError('');
        setStep(2);
    };

    const handleFinalConfirm = () => {
        onConfirm();
        handleClose();
    };

    return (
        <div className="delete-account-modal-overlay" onClick={handleOverlayClick}>
            <div className="delete-account-modal">
                {step === 1 ? (
                    <>
                        <div className="modal-icon danger">⚠️</div>
                        <h2>Confirm Account Deletion</h2>
                        <p className="modal-description">
                            To confirm you want to delete your account, please enter your email address:
                        </p>
                        <p className="user-email">{userEmail}</p>
                        
                        <form onSubmit={handleEmailSubmit}>
                            {error && <div className="error-message">{error}</div>}
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Enter your email"
                                autoFocus
                            />
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={handleClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="continue-btn">
                                    Continue
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="modal-icon danger">🚨</div>
                        <h2>Final Warning</h2>
                        <div className="warning-box">
                            <p><strong>This action is PERMANENT and CANNOT be undone.</strong></p>
                            <p>All your data will be permanently deleted:</p>
                            <ul>
                                <li>📝 All Notes</li>
                                <li>📅 All Calendar Events</li>
                                <li>⚙️ All Settings</li>
                            </ul>
                        </div>
                        <p className="final-question">Are you absolutely sure you want to delete your account?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={handleClose}>
                                No, Keep My Account
                            </button>
                            <button className="delete-btn" onClick={handleFinalConfirm}>
                                Yes, Delete Forever
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountModal;
