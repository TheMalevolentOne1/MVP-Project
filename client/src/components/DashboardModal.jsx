import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardModal.css';

/*
Brief: DashboardModal component that prompts users to confirm their action when creating a new note or event from the dashboard.

@Param1: isOpen - Boolean to control modal visibility.
@Param2: onClose - Function to call when the modal should be closed.
@Param3: type - String to indicate the type of action ('note' or 'event').

@Return: JSX Element
@ReturnT: The DashboardModal component that can be used to confirm user actions before navigating to the respective creation pages.
@ReturnF: Returns null if the modal is not open.
*/
const DashboardModal = ({ isOpen, onClose, type }) => 
{
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleAction = () => 
    {
        onClose();

        if (type === 'note') 
        {
            navigate('/notes');
        } 
        else if (type === 'event') 
        {
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
