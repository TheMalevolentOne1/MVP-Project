import React, { useState, useEffect } from 'react'; // useState for component state management and useEffect for functions that run after render
import { useTheme } from '../hooks/useTheme';
import { useLocation } from 'react-router-dom'; // useLocation to access the current URL and query parameters
import { showToast } from '../showToast'; // Utility function to show notifications respecting user preferences
import { FiChevronLeft, FiChevronRight, FiBookOpen, FiDownload, FiUpload } from 'react-icons/fi'; // Importing icons for navigation and actions

import { eventsAPI, timetableAPI } from '../apiHandler'; // API handler for making requests to the backend related to events

import AppHeader from '../components/AppHeader'; // AppHeader component for displaying the page title
import Navbar from '../components/Navbar'; // Navbar component for site navigation
import EventModal from '../components/EventModal'; // EventModal component for creating and editing events
import TimetableModal from '../components/TimetableModal'; // TimetableModal component for logging into the timetable uclan timetable
import ConfirmModal from '../components/ConfirmModal'; // ConfirmModal component for confirming actions like event deletion

import './CalendarPage.css'; // CSS file for styling the CalendarPage component

const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const TIMEZONE = 'GMT';

/*
Brief: Get the Monday of the week for a given date.

@Param1: date - A Date object representing any date within the week.

@Return: Date Object
@ReturnT: Monday of the week.
*/
const getMonday = (date) => 
{
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0) to go back 6 days, otherwise go back to Monday
    return new Date(d.setDate(diff));
};

/*
Brief: CalendarPage component that displays a weekly calendar view, 
allows users to create, edit, delete events, and import/export calendar data.

@Return: JSX Element
@ReturnT: The rendered calendar page with all functionalities.
*/
const CalendarPage = () => 
{
    // Ensure theme is applied on mount
    useTheme();
    
    const location = useLocation();

    const [events, setEvents] = useState([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [showModal, setShowModal] = useState(false);
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    // Removed unused theme and setTheme

    // Fetch events on initial load and when the URL query parameters change (to handle dashboard "create" parameter)
    useEffect(() => 
    {
        fetchEvents();
        // Check for create parameter from dashboard
        const params = new URLSearchParams(location.search);
        if (params.get('create') === 'true') 
        {
            setShowModal(true);
        }
    }, [location.search]);

    // Fetch events whenever the current week changes to ensure the calendar displays up-to-date information for the selected week.
    useEffect(() => 
    {
        fetchEvents();
    }, [currentWeekStart]);

    /*
    Brief: Fetch all calendar events from the backend API and update the component state.
    */
    const fetchEvents = async () => 
    {
        try {
            const { data } = await eventsAPI.getAll();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    /*
    Brief: Handle click on a calendar slot to create a new event.

    @Param1: date - The date of the clicked slot.
    @Param2: hour - The hour of the clicked slot.
    */
    const handleSlotClick = (date, hour) => {
        setSelectedSlot({ date, hour });
        setEditingEvent(null);
        setShowModal(true);
    };

    /*
    Brief: Handle click on an existing event to edit it.

    @Param1: event - The event object that was clicked.
    */
    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setSelectedSlot(null);
        setShowModal(true);
    };

    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, eventId: null });

    /*
    Brief: Handle click on the delete button of an event to open the confirmation modal.

    @Param1: eventId - The ID of the event to be deleted.
    */
    const handleDeleteEvent = (eventId) => {
        setDeleteConfirm({ isOpen: true, eventId });
    };

    /*
    Brief: Confirm deletion of an event by calling the delete API and refreshing the events list.
    */
    const confirmDeleteEvent = async () => 
    {
        try 
        {
            const { data } = await eventsAPI.delete(deleteConfirm.eventId);

            console.log(`${deleteConfirm.eventId} delete response:`, data); // Log the response for debugging
            
            if (data.success) 
            {
                showToast('Event deleted', 'success');
                fetchEvents();
            } 
            else 
            {
                showToast('Failed to delete event: ' + data.error, 'error');
            }
        } 
        catch (error) 
        {
            console.error('Error deleting event:', error);
            showToast('Error deleting event', 'error');
        } 
        finally 
        {
            setDeleteConfirm({ isOpen: false, eventId: null });
        }
    };

    /*
    Brief: Handle saving of an event (both creating new and updating existing) by calling the appropriate API endpoint and refreshing the events list.

    @Param1: eventData - An object containing the event details (title, start time, end time, etc.).
    @Param2: eventId - The ID of the event being edited (null if creating a new event).
     */
    const handleSaveEvent = async (eventData, eventId) => 
    {
        try 
        {
            let response;
            
            if (eventId) 
            {
                response = await eventsAPI.update(eventId, eventData);
            } 
            else 
            {
                response = await eventsAPI.create(eventData);
            }

            if (response.data.success) 
            {
                showToast(eventId ? 'Event updated' : 'Event created', 'success');
                fetchEvents();
            } 
            else 
            {
                showToast('Failed to save event: ' + response.data.error, 'error');
            }
        } 
        catch (error) 
        {
            console.error('Error saving event:', error);
            showToast('Error saving event', 'error');
        }
    }

    /*
    Brief: Handle click on "Import Timetable" button to open the timetable login modal.
    */
    const handleExtractTimetable = () => 
    {
        setShowTimetableModal(true);
    }

    /*
    Brief: Handle submission of timetable login credentials, fetch events from the timetable, and update the calendar.
    
    @Param1: email - The user's email for the timetable login.
    @Param2: password - The user's password for the timetable login.

    @Return: Promise
    @ReturnT: Resolves if timetable import is successful, otherwise throws an error.
    @ReturnF: Rejects with an error if timetable import fails.
    */
    const handleTimetableSubmit = async (user_data) => 
    {
        const { email, password } = user_data;

        try 
        {
            console.log('Sending timetable sync request:', { email, password: '***' }); // Log request (hide password)
            
            const { data } = await timetableAPI.sync(email, password);

            if (data.success) 
            {
                showToast(`Imported ${data.imported} events from timetable`, 'success');
                
                if (data.errors && data.errors.length > 0)
                {
                    showToast(`${data.errors.length} events had warnings during import`, 'custom');
                    console.warn('Timetable import warnings:', data.errors);
                }

                fetchEvents();
            } 
            else 
            {
                showToast('Failed to import timetable: ' + data.error, 'error');
            }
        } 
        catch (error) 
        {
            console.error('Error importing timetable:', error);
            console.error('Error response:', error.response?.data); // ← Add this
            console.error('Error status:', error.response?.status); // ← Add this
            console.error('Request data:', { email, password: '***' }); // ← Add this
            showToast(error.response?.data?.error || 'Failed to import timetable', 'error');
        }
    }
    

    /*
    Brief: Handle click on "Export" button to download the user's calendar events as an ICS file.
    
    @Return: Promise
    @ReturnT: Resolves if export is successful and the download starts, otherwise throws an error.
    @ReturnF: Rejects with an error if export fails.
    */
    const handleExportICS = async () => 
    {
        try 
        {
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
            showToast('Calendar exported', 'success');
        } 
        catch (error) 
        {
            console.error('Error exporting ICS:', error);
            showToast('Failed to export calendar', 'error');
        }
    }

    /*
    Brief: Handle selection of an ICS file for import

    @Param1: event - The file input change event containing the selected file.

    @Return: Promise
    @ReturnT: Resolves if import is successful and events are added to the calendar, otherwise throws an error.
    @ReturnF: Rejects with an error if import fails or if the file is invalid.
    */
    const handleImportICS = async (event) => 
    {
        const file = event.target.files[0];
        if (!file) return;

        // Client-side validation
        if (!file.name.endsWith('.ics')) 
        {
            showToast('Please select a valid .ics file', 'error');
            event.target.value = '';
            return;
        }

        if (file.size > 1024 * 1024) 
        {
            showToast('File too large. Maximum size is 1MB.', 'error');
            event.target.value = '';
            return;
        }

        try 
        {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await eventsAPI.importICS(formData);
            
            if (data.success) 
            {
                showToast(`Imported ${data.imported} events`, 'success');
                
                if (data.errors && data.errors.length > 0) 
                {
                    showToast(`${data.errors.length} events had warnings`, 'custom');
                }
                
                fetchEvents();
            } 
            else 
            {
                showToast('Import failed: ' + data.error, 'error');
            }
        } 
        catch (error) 
        {
            console.error('Error importing ICS:', error);
            showToast(error.response?.data?.error || 'Failed to import calendar', 'error');
        } 
        finally 
        {
            event.target.value = ''; // Reset file input
        }
    }

    /*
    Brief: Change the current week being displayed by adding a specified number of days to the current week start date.

    @Param1: days - The number of days to add (positive to go forward, negative to go backward).
    */
    const changeWeek = (days) => 
    {
        setCurrentWeekStart(new Date(currentWeekStart.getTime() + days * 24 * 60 * 60 * 1000));
    };

    /*
    Brief: Format the week label for display on the calendar, showing the date range of the current week.

    @Return: String
    @ReturnT: A formatted string representing the week range.
    */
    const formatWeekLabel = () => 
    {
        const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000); // Calculate the end date of the week by adding 6 days to the start date
        const options = { month: 'short', day: 'numeric' };
        return `${currentWeekStart.toLocaleDateString('en-GB', options)} - ${weekEnd.toLocaleDateString('en-GB', options)}`;
    };

    /*
    Brief: Get all dates in the current week starting from Monday.

    @Return: Array of Date Objects
    @ReturnT: Array containing the dates of the current week.
    */
    const getWeekDates = () => 
    {
        const dates = [];
        for (let i = 0; i < DAYS_IN_WEEK; i++) 
        {
            dates.push(new Date(currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000));
        }
        return dates;
    };

    /*
    Brief: Check if a given date is today.

    @Param1: date - The date to check.

    @Return: Boolean
    @ReturnT: True if the date is today, false otherwise.
    */
    const isToday = (date) => 
    {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    /*
    Brief: Get all events that start in a specific time slot (day and hour).

    @Param1: slotDate - The date of the slot.
    @Param2: slotHour - The hour of the slot (0-23).

    @Return: Array of Event Objects
    @ReturnT: Array containing all events that start in the specified slot.
    */
    const getEventsStartingInSlot = (slotDate, slotHour) => 
    {
        return events.filter(event => {
            const eventStart = new Date(event.start);
            return (
                eventStart.getDate() === slotDate.getDate() &&
                eventStart.getMonth() === slotDate.getMonth() &&
                eventStart.getFullYear() === slotDate.getFullYear() &&
                eventStart.getHours() === slotHour
            );
        });
    };

    /*
    Brief: Calculate the CSS style for an event block based on its start and end times relative to a given date.

    @Param1: event - The event object containing start and end_time.
    @Param2: slotDate - The date of the slot where the event is being rendered.

    @Return: Object
    @ReturnT: An object containing CSS properties (top, height, minHeight) for positioning the event block.
    */
    const calculateEventStyle = (event, slotDate) => 
    {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end_time);
        const dayStart = new Date(slotDate);
        dayStart.setHours(0, 0, 0, 0); // Start of the day
        const dayEnd = new Date(slotDate);
        dayEnd.setHours(23, 59, 59, 999); // End of the day

        const startsOnCurrentDay = eventStart >= dayStart && eventStart <= dayEnd;
        const endsOnCurrentDay = eventEnd >= dayStart && eventEnd <= dayEnd;

        let topOffset = 0;
        let durationHours = 0;

        if (startsOnCurrentDay && endsOnCurrentDay) 
        {
            // Event starts and ends on the same day
            const startMinutes = eventStart.getHours() + eventStart.getMinutes() / 60;
            const endMinutes = eventEnd.getHours() + eventEnd.getMinutes() / 60;
            durationHours = endMinutes - startMinutes;
            topOffset = (startMinutes % 1) * 100; // Percentage within the hour

        } 
        else if (startsOnCurrentDay) 
        {
            // Event starts today but ends later
            const startMinutes = eventStart.getHours() + eventStart.getMinutes() / 60;
            const durationMs = dayEnd - eventStart;
            durationHours = durationMs / (1000 * 60 * 60);
            topOffset = (startMinutes % 1) * 100;

        } 
        else if (endsOnCurrentDay) 
        {

            // Event started before today, ends today
            const dayStart = new Date(slotDate);
            dayStart.setHours(0, 0, 0, 0);
            const durationMs = eventEnd - dayStart;
            durationHours = durationMs / (1000 * 60 * 60);
            topOffset = 0; // Start from top since it started before

        } 
        else 
        {
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

    /*
    Brief: Render the calendar grid for the current week, including day headers and time slots, and populate it with event blocks based on the events data.

    @Return: JSX Element
    @ReturnT: A JSX element representing the calendar grid, with day headers at the top and time slots for each hour of each day, populated with event blocks that are styled according to their start and end times.
    */
    const renderGrid = () => {
        const weekDates = getWeekDates();
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <div className="calendar-grid">
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
                                                        {new Date(event.start).toLocaleTimeString(TIMEZONE, { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })} - {new Date(event.end_time).toLocaleTimeString(TIMEZONE, { 
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
                                                        🗑
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