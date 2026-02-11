import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';import { FiEdit3, FiCalendar, FiTrash2 } from 'react-icons/fi';import { notesAPI, eventsAPI } from '../apiHandler';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import DashboardModal from '../components/DashboardModal';
import ConfirmModal from '../components/ConfirmModal';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [recentNotes, setRecentNotes] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('note');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, eventId: null });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [notesRes, eventsRes] = await Promise.all([
                notesAPI.getRecent(),
                eventsAPI.getUpcoming()
            ]);

            if (notesRes.data.success) {
                setRecentNotes(notesRes.data.notes);
            }
            if (eventsRes.data.success) {
                setUpcomingEvents(eventsRes.data.events);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNoteClick = (noteTitle) => {
        navigate(`/notes?note=${encodeURIComponent(noteTitle)}`);
    };

    const handleEventDelete = (eventId) => {
        setDeleteConfirm({ isOpen: true, eventId });
    };

    const confirmEventDelete = async () => {
        try {
            await eventsAPI.delete(deleteConfirm.eventId);
            loadDashboardData();
            toast.success('Event deleted');
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error('Failed to delete event');
        } finally {
            setDeleteConfirm({ isOpen: false, eventId: null });
        }
    };

    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };

    return (
        <div className="dashboard-page">
            <AppHeader title="Dashboard" />
            <Navbar />

            <div className="dashboard-container">
                {/* Recent Notes */}
                <div className="dashboard-sidebar dashboard-notes-sidebar">
                    <h2>Recent Notes</h2>
                    <div className="dashboard-list">
                        {loading ? (
                            <p className="loading-text">Loading notes...</p>
                        ) : recentNotes.length > 0 ? (
                            recentNotes.map(note => (
                                <div 
                                    key={note.title} 
                                    className="dashboard-item"
                                    onClick={() => handleNoteClick(note.title)}
                                >
                                    <h3>{note.title}</h3>
                                    <p>{new Date(note.updated_at).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <p>No recent notes</p>
                        )}
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="dashboard-main">
                    <h2>Quick Overview</h2>
                    <div className="dashboard-tbd">
                        <p>Welcome to your dashboard!</p>
                        
                        {/* Quick Action Buttons */}
                        <div className="quick-actions">
                            <button onClick={() => openModal('note')} className="action-card">
                                <span className="action-icon"><FiEdit3 /></span>
                                <span className="action-label">Create Note</span>
                            </button>
                            <button onClick={() => openModal('event')} className="action-card">
                                <span className="action-icon"><FiCalendar /></span>
                                <span className="action-label">Create Event</span>
                            </button>
                        </div>
                        
                        <div className="quick-stats">
                            <div className="stat-card">
                                <span className="stat-number">{recentNotes.length}</span>
                                <span className="stat-label">Recent Notes</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">{upcomingEvents.length}</span>
                                <span className="stat-label">Upcoming Events</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="dashboard-sidebar dashboard-events-sidebar">
                    <h2>Upcoming Events</h2>
                    <div className="dashboard-list">
                        {loading ? (
                            <p className="loading-text">Loading events...</p>
                        ) : upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => (
                                <div key={event.id} className="dashboard-item event-item">
                                    <div className="event-content">
                                        <h3>{event.title}</h3>
                                        <p>{new Date(event.start).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventDelete(event.id);
                                        }}
                                        className="delete-event-btn"
                                        title="Delete Event"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No upcoming events</p>
                        )}
                    </div>
                </div>
            </div>

            <DashboardModal 
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Event"
                message="Are you sure you want to delete this event?"
                confirmText="Delete"
                cancelText="Cancel"
                confirmStyle="danger"
                onConfirm={confirmEventDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, eventId: null })}
            />
        </div>
    );
};

export default Dashboard;