import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiBookOpen, FiDownload, FiUpload } from 'react-icons/fi';
import { eventsAPI } from '../apiHandler';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import EventModal from '../components/EventModal';
import TimetableModal from '../components/TimetableModal';
import ConfirmModal from '../components/ConfirmModal';
import './CalendarPage.css';

const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;

// Helper function
const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const CalendarPage = () => {
    const location = useLocation();
    const [events, setEvents] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [showModal, setShowModal] = useState(false);
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
        
        // Check for create parameter from dashboard
        const params = new URLSearchParams(location.search);
        if (params.get('create') === 'true') {
            setShowModal(true);
        }
    }, [location.search]);

    useEffect(() => {
        fetchEvents();
    }, [currentWeekStart]);

    const fetchEvents = async () => {
        try {
            const { data } = await eventsAPI.getAll();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const handleSlotClick = (date, hour) => {
        setSelectedSlot({ date, hour });
        setEditingEvent(null);
        setShowModal(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setSelectedSlot(null);
        setShowModal(true);
    };

    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, eventId: null });

    const handleDeleteEvent = (eventId) => {
        setDeleteConfirm({ isOpen: true, eventId });
    };

    const confirmDeleteEvent = async () => {
        try {
            const { data } = await eventsAPI.delete(deleteConfirm.eventId);
            if (data.success) {
                toast.success('Event deleted');
                fetchEvents();
            } else {
                toast.error('Failed to delete event: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Error deleting event');
        } finally {
            setDeleteConfirm({ isOpen: false, eventId: null });
        }
    };

    const handleSaveEvent = async (eventData, eventId) => {
        try {
            let response;
            
            if (eventId) {
                response = await eventsAPI.update(eventId, eventData);
            } else {
                response = await eventsAPI.create(eventData);
            }

            if (response.data.success) {
                toast.success(eventId ? 'Event updated' : 'Event created');
                fetchEvents();
            } else {
                toast.error('Failed to save event: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Error saving event');
        }
    };

    const handleExtractTimetable = () => {
        setShowTimetableModal(true);
    };

    const handleTimetableSubmit = async ({ email, password }) => {
        try {
            const { data } = await eventsAPI.syncTimetable(email, password);
            
            if (data.success) {
                toast.success(`Imported ${data.imported} events from timetable`);
                fetchEvents(); // Refresh calendar
            } else {
                throw new Error(data.error || 'Failed to import timetable');
            }
        } catch (error) {
            console.error('Timetable sync error:', error);
            throw new Error(error.response?.data?.error || 'Failed to import timetable');
        }
    };

    // ICS Export handler
    const handleExportICS = async () => {
        try {
            const response = await eventsAPI.exportICS();
            
            // Create download link
            const blob = new Blob([response.data], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'asc-calendar.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Calendar exported');
        } catch (error) {
            console.error('Error exporting ICS:', error);
            toast.error('Failed to export calendar');
        }
    };

    // ICS Import handler
    const handleImportICS = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Client-side validation
        if (!file.name.endsWith('.ics')) {
            toast.error('Please select a valid .ics file');
            event.target.value = '';
            return;
        }

        if (file.size > 1024 * 1024) {
            toast.error('File too large. Maximum size is 1MB.');
            event.target.value = '';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await eventsAPI.importICS(formData);
            
            if (data.success) {
                toast.success(`Imported ${data.imported} events`);
                if (data.errors && data.errors.length > 0) {
                    toast(`${data.errors.length} events had warnings`, { icon: '⚠️' });
                }
                fetchEvents();
            } else {
                toast.error('Import failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error importing ICS:', error);
            toast.error(error.response?.data?.error || 'Failed to import calendar');
        } finally {
            event.target.value = ''; // Reset file input
        }
    };

    const changeWeek = (days) => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + days);
        setCurrentWeekStart(newWeekStart);
    };

    const getWeekDates = () => {
        const dates = [];
        for (let i = 0; i < DAYS_IN_WEEK; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const formatWeekLabel = () => {
        const weekDates = getWeekDates();
        const start = weekDates[0];
        const end = weekDates[6];
        const opts = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const getEventsStartingInSlot = (date, hour) => {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        return events.filter(event => {
            const eventStart = new Date(event.start);
            // Only return events that START within this hour slot
            return eventStart >= slotStart && eventStart < slotEnd;
        });
    };

    const calculateEventStyle = (event, slotDate = null) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end_time);
        const currentSlotDate = slotDate ? new Date(slotDate) : new Date(eventStart); // Get current day being rendered
        
        // Check if event spans multiple days
        const startsOnCurrentDay = eventStart.toDateString() === currentSlotDate.toDateString();
        const endsOnCurrentDay = eventEnd.toDateString() === currentSlotDate.toDateString();
        
        // Calculate top offset based on minutes past the hour
        let topOffset = 0;
        if (startsOnCurrentDay) {
            const startMinutes = eventStart.getMinutes();
            topOffset = (startMinutes / 60) * 100;
        }
        
        // Calculate height based on duration in hours
        let durationHours = 0;
        if (startsOnCurrentDay && endsOnCurrentDay) {
            // Event fully contained in this day
            const durationMs = eventEnd - eventStart;
            durationHours = durationMs / (1000 * 60 * 60);
        } else if (startsOnCurrentDay) {
            // Event starts today, ends tomorrow or later
            const dayEnd = new Date(eventStart);
            dayEnd.setHours(23, 59, 59, 999);
            const durationMs = dayEnd - eventStart;
            durationHours = durationMs / (1000 * 60 * 60);
        } else if (endsOnCurrentDay) {
            // Event started before today, ends today
            const dayStart = new Date(slotDate);
            dayStart.setHours(0, 0, 0, 0);
            const durationMs = eventEnd - dayStart;
            durationHours = durationMs / (1000 * 60 * 60);
            topOffset = 0; // Start from top since it started before
        } else {
            // Event spans entire day
            durationHours = 24;
            topOffset = 0;
        }
        
        const height = durationHours * 60; // 60px per hour
        
        return {
            top: `${topOffset}%`,
            height: `${height}px`,
            minHeight: `${height}px`
        };
    };

    const renderGrid = () => {
        const weekDates = getWeekDates();
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <div className="calendar-grid">
                {/* Top-left corner cell */}
                <div className="grid-header-cell"></div>
                
                {/* Day headers */}
                {weekDates.map((date, i) => (
                    <div 
                        key={`header-${i}`} 
                        className={`grid-header-cell ${isToday(date) ? 'today' : ''}`}
                    >
                        {dayNames[i]} {date.getDate()}
                    </div>
                ))}

                {/* Time slots grid */}
                {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
                    <React.Fragment key={`hour-${hour}`}>
                        {/* Time label */}
                        <div className="time-label-cell">
                            {String(hour).padStart(2, '0')}:00
                        </div>
                        
                        {/* Day columns for this hour */}
                        {weekDates.map((date, dayIndex) => {
                            const slotEvents = getEventsStartingInSlot(date, hour);
                            return (
                                <div
                                    key={`slot-${dayIndex}-${hour}`}
                                    className="grid-slot"
                                    onClick={() => handleSlotClick(date, hour)}
                                >
                                    {slotEvents.map(event => {
                                        const eventStyle = calculateEventStyle(event, date);
                                        return (
                                            <div 
                                                key={event.id} 
                                                className="event-block continuous"
                                                style={eventStyle}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="event-content">
                                                    <span className="event-time">
                                                        {new Date(event.start).toLocaleTimeString('en-US', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })} - {new Date(event.end_time).toLocaleTimeString('en-US', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                    <span className="event-title">{event.title}</span>
                                                    {event.location && <span className="event-location">{event.location}</span>}
                                                </div>
                                                <div className="event-actions">
                                                    <button
                                                        className="edit-event-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditEvent(event);
                                                        }}
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="delete-event-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id);
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="calendar-page">
            <AppHeader title="Calendar" />
            <Navbar />

            <main className="calendar-main">
                <div className="calendar-controls">
                    <button className="nav-btn" onClick={() => changeWeek(-7)}>
                        <FiChevronLeft /> Prev
                    </button>
                    <span className="week-label">{formatWeekLabel()}</span>
                    <button className="nav-btn" onClick={() => changeWeek(7)}>
                        Next <FiChevronRight />
                    </button>
                    <button className="timetable-btn" onClick={handleExtractTimetable}>
                        <FiBookOpen /> Import Timetable
                    </button>
                    <div className="ics-controls">
                        <button className="ics-btn export" onClick={handleExportICS} title="Export to ICS">
                            <FiDownload /> Export
                        </button>
                        <label className="ics-btn import" title="Import from ICS">
                            <FiUpload /> Import
                            <input
                                type="file"
                                accept=".ics"
                                onChange={handleImportICS}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <div className="calendar-scroll-area">
                    {renderGrid()}
                </div>
            </main>

            <EventModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                    setSelectedSlot(null);
                }}
                onSave={handleSaveEvent}
                selectedSlot={selectedSlot}
                editingEvent={editingEvent}
            />

            <TimetableModal
                isOpen={showTimetableModal}
                onClose={() => setShowTimetableModal(false)}
                onSubmit={handleTimetableSubmit}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Event"
                message="Are you sure you want to delete this event?"
                confirmText="Delete"
                cancelText="Cancel"
                confirmStyle="danger"
                onConfirm={confirmDeleteEvent}
                onCancel={() => setDeleteConfirm({ isOpen: false, eventId: null })}
            />
        </div>
    );
};

export default CalendarPage;