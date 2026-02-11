import React, { useState } from 'react';
import './TimetableModal.css';

const TimetableModal = ({ isOpen, onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

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

    const handleClose = () => {
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
