import React, { useState, useEffect } from 'react';
import './EventModal.css';

const EventModal = ({ isOpen, onClose, onSave, selectedSlot, editingEvent }) => {
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end_time: '',
        location: '',
        description: ''
    });

    useEffect(() => {
        if (editingEvent) {
            // Editing existing event
            setFormData({
                title: editingEvent.title || '',
                start: editingEvent.start ? editingEvent.start.slice(0, 16) : '',
                end_time: editingEvent.end_time ? editingEvent.end_time.slice(0, 16) : '',
                location: editingEvent.location || '',
                description: editingEvent.description || ''
            });
        } else if (selectedSlot) {
            // Creating new event from selected slot
            const { date, hour } = selectedSlot;
            const startDate = new Date(date);
            startDate.setHours(hour, 0, 0, 0);
            const isoString = startDate.toISOString().slice(0, 16);
            
            setFormData({
                title: '',
                start: isoString,
                end_time: '',
                location: '',
                description: ''
            });
        }
    }, [editingEvent, selectedSlot]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.start.trim()) {
            alert('Event title and start time are required.');
            return;
        }

        const endTime = formData.end_time.trim() || formData.start.trim();

        if (new Date(endTime) < new Date(formData.start)) {
            alert('End time cannot be before start time.');
            return;
        }

        const eventData = {
            ...formData,
            end_time: endTime
        };

        await onSave(eventData, editingEvent?.id);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            title: '',
            start: '',
            end_time: '',
            location: '',
            description: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                
                <form onSubmit={handleSubmit}>
                    <label>
                        Title
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter Event Title"
                            required
                        />
                    </label>

                    <label>
                        Start
                        <input
                            type="datetime-local"
                            name="start"
                            value={formData.start}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        End
                        <input
                            type="datetime-local"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </label>

                    <label>
                        Location
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter Location (Optional)"
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter Description (Optional)"
                        />
                    </label>

                    <div className="modal-actions">
                        <button type="submit" className="submit-btn">
                            {editingEvent ? 'Save' : 'Create'}
                        </button>
                        <button type="button" onClick={handleClose} className="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
