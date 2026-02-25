import React, { useState, useEffect } from 'react';
import './EventModal.css';
import toast from 'react-hot-toast';

/*
Brief: EventModal component that provides a form for creating or editing calendar events, with validation and user feedback.

@Param1: isOpen - Boolean to control modal visibility.
@Param2: onClose - Function to call when the modal is closed.
@Param3: onSave - Function to call when the event is saved, receiving the event data and optional event ID for editing.
@Param4: selectedSlot - Object containing date and hour for pre-filling the form when creating a new event from a calendar slot.
@Param5: editingEvent - Object containing existing event data for pre-filling the form when editing an event.

@Return: JSX Element
@ReturnT: The EventModal component that can be used to create or edit calendar events, with form validation and user feedback for errors.
@ReturnF: Returns null if the modal is not open.
*/
const EventModal = ({ isOpen, onClose, onSave, selectedSlot, editingEvent }) => {
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end_time: '',
        location: '',
        description: ''
    });

    /*
    Brief: pre-fill the form data when editing an existing event or calendar slot selected
    */
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

    /*
    Brief: Handles changes to form inputs and updates the formData state accordingly.
    
    @Param1: e - The event object from the input change event, containing the name and value of the changed input.
    */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /*
    Brief: Handles form submission for creating or editing an event, with validation for required fields and logical date/time.
    
    @Param1: e - The event object from the form submission, used to prevent default form behavior.
    */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.start.trim()) {
            toast.error('Event title and start time are required.');
            return;
        }

        const endTime = formData.end_time.trim() || formData.start.trim();

        const startDate = new Date(formData.start);
        const endDate = new Date(endTime);
        
        // Ensures event cannot be ended before its begun
        if (endDate < startDate) 
        {
            toast.error('End time cannot be before start time.');
            return;
        }
        
        // Ensures that start and end times are not the same
        if (endDate.getTime() === startDate.getTime()) 
        {
            toast.error('Start and end time cannot be the same.');
            return;
        }

        const eventData = {...formData,end_time: endTime};

        await onSave(eventData, editingEvent?.id);
        handleClose();
    };

    /*
    Brief: Handles closing the modal, resetting form data and state, and calling the onClose callback.
    */
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
