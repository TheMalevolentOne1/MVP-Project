import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardModal.css';

const DashboardModal = ({ isOpen, onClose, type }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleAction = () => {
        onClose();
        if (type === 'note') {
            navigate('/notes');
        } else if (type === 'event') {
            navigate('/calendar?create=true');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{type === 'note' ? 'Create New Note' : 'Create New Event'}</h2>
                <p>
                    {type === 'note' 
                        ? 'You will be redirected to the Notes page to create a new note.'
                        : 'You will be redirected to the Calendar page to create a new event.'
                    }
                </p>
                <div className="modal-actions">
                    <button onClick={handleAction} className="btn-primary">
                        Continue
                    </button>
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardModal;
