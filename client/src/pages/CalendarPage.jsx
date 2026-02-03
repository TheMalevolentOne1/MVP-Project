import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { eventsAPI } from '../apiHandler';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import EventModal from '../components/EventModal';
import TimetableModal from '../components/TimetableModal';
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

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Delete this event?')) {
            return;
        }

        try {
            const { data } = await eventsAPI.delete(eventId);
            if (data.success) {
                console.log('Event deleted:', eventId);
                fetchEvents();
            } else {
                alert('Failed to delete event: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error deleting event');
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
                console.log(eventId ? 'Event updated' : 'Event created');
                alert(eventId ? 'Event Updated' : 'Event Created');
                fetchEvents();
            } else {
                alert('Failed to save event: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event');
        }
    };

    const handleExtractTimetable = () => {
        setShowTimetableModal(true);
    };

    const handleTimetableSubmit = async ({ email, password }) => {
        try {
            const { data } = await eventsAPI.syncTimetable(email, password);
            
            if (data.success) {
                alert(`✓ Timetable Import Complete\n\nImported: ${data.imported} events`);
                fetchEvents(); // Refresh calendar
            } else {
                throw new Error(data.error || 'Failed to import timetable');
            }
        } catch (error) {
            console.error('Timetable sync error:', error);
            throw new Error(error.response?.data?.error || 'Failed to import timetable');
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

    const calculateEventStyle = (event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end_time);
        
        // Calculate top offset based on minutes past the hour
        const startMinutes = eventStart.getMinutes();
        const topOffset = (startMinutes / 60) * 100;
        
        // Calculate height based on duration in hours
        const durationMs = eventEnd - eventStart;
        const durationHours = durationMs / (1000 * 60 * 60);
        const height = durationHours * 60; // 60px per hour (matches min-height of grid-slot)
        
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
                                        const eventStyle = calculateEventStyle(event);
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
                        ← Prev
                    </button>
                    <span className="week-label">{formatWeekLabel()}</span>
                    <button className="nav-btn" onClick={() => changeWeek(7)}>
                        Next →
                    </button>
                    <button className="timetable-btn" onClick={handleExtractTimetable}>
                        📚 Import Timetable
                    </button>
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
        </div>
    );
};

export default CalendarPage;