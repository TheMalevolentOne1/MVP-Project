import React from 'react';
import './ConfirmModal.css';

/*
Brief: Reusable confirmation modal component that can be used for confirming actions like deletions.

@Param1: isOpen - Boolean to control modal visibility.
@Param2: onConfirm - Function to call when the user confirms the action.
@Param3: onCancel - Function to call when the user cancels the action.
@Param4: title - The title text to display in the modal.
@Param5: message - The message text to display in the modal.
@Param6: confirmText - The text to display on the confirm button.
@Param7: cancelText - The text to display on the cancel button.
@Param8: confirmStyle - The style of the confirm button ('danger' or 'primary').

@Return: JSX Element
@ReturnT: The ConfirmModal component that can be used to prompt users for confirmation before performing critical actions.
@ReturnF: Returns null if the modal is not open.
*/
const ConfirmModal = (
{ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmStyle = 'danger' // 'danger' | 'primary'
}) => 
{
    if (!isOpen) return null;

    const handleOverlayClick = (e) => 
    {
        if (e.target === e.currentTarget) 
        {
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
