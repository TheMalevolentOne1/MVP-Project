import React, { useState } from 'react';
import './TimetableModal.css';

/*
Brief: TimetableModal component that allows users to import their university timetable by entering their portal credentials.

@Param1: isOpen (boolean) - Controls the visibility of the modal.
@Param2: onClose (function) - Callback function to close the modal.
@Param3: onSubmit (function) - Callback function that handles the submission of the credentials and timetable import.

@Return: JSX Element
@ReturnT: The TimetableModal component that can be used to import university timetables by providing portal credentials.
*/

const TimetableModal = ({ isOpen, onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    /*
    Brief: Handles the form submission for importing the timetable. Validates input, manages loading state, and calls the onSubmit callback with the credentials.

    @Param1: e (Event) - The form submission event.
    */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ email, password });
            setEmail('');
            setPassword('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to import timetable');
        } finally {
            setLoading(false);
        }
    };

    /*
    Brief: Handles closing the modal. Resets the form state and calls the onClose callback.
    */
    const handleClose = () => 
    {
        setEmail('');
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content timetable-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Import University Timetable</h2>
                <p className="modal-description">
                    Enter your university portal credentials to import your timetable events.
                </p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-group">
                        <label htmlFor="timetable-email">University Email</label>
                        <input
                            type="email"
                            id="timetable-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@university.edu"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="timetable-password">Password</label>
                        <input
                            type="password"
                            id="timetable-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your portal password"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Importing...' : 'Import Timetable'}
                        </button>
                        <button 
                            type="button"
                            onClick={handleClose} 
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <p className="modal-note">
                    ⚠️ Your credentials are only used to fetch your timetable and are not stored.
                </p>
            </div>
        </div>
    );
};

export default TimetableModal;
