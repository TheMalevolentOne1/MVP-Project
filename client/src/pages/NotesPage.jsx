import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { notesAPI } from '../apiHandler';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import './NotesPage.css';

const NotesPage = () => {
    const location = useLocation();
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreview, setIsPreview] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [initialTitle, setInitialTitle] = useState('');
    const [initialContent, setInitialContent] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
    const [pendingNoteSelect, setPendingNoteSelect] = useState(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSelectNote = useCallback(async (noteTitle) => {
        if (hasUnsavedChanges) {
            setPendingNoteSelect(noteTitle);
            setConfirmModal({
                isOpen: true,
                type: 'switch',
                data: null
            });
            return;
        }

        await loadNote(noteTitle);
    }, [hasUnsavedChanges]);

    const loadNote = async (noteTitle) => {
        try {
            const { data } = await notesAPI.getByTitle(noteTitle);
            if (data.success) {
                setSelectedNote(data.note);
                setTitle(data.note.title);
                setContent(data.note.content);
                setInitialTitle(data.note.title);
                setInitialContent(data.note.content);
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error('Failed to load note:', error);
        }
    };

    const confirmSwitchNote = async () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        if (pendingNoteSelect) {
            await loadNote(pendingNoteSelect);
            setPendingNoteSelect(null);
        }
    };

    useEffect(() => {
        // Check for note parameter in URL
        const params = new URLSearchParams(location.search);
        const noteTitle = params.get('note');
        if (noteTitle && notes.length > 0) {
            handleSelectNote(noteTitle);
        }
    }, [location.search, notes, handleSelectNote]);

    useEffect(() => {
        // Track unsaved changes
        const changed = title !== initialTitle || content !== initialContent;
        setHasUnsavedChanges(changed);
    }, [title, content, initialTitle, initialContent]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Keyboard shortcuts: Ctrl+S to save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (title && content) {
                    handleSaveNote();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const fetchNotes = async () => {
        try {
            const { data } = await notesAPI.getAll();
            if (data.success) {
                setNotes(data.notes);
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        }
    };

    const handleSaveNote = async () => {
        if (!title || !content) {
            alert('Please enter title and content');
            return;
        }

        try {
            if (selectedNote) {
                await notesAPI.update(selectedNote.title, title, content);
            } else {
                await notesAPI.create(title, content);
            }
            fetchNotes();
            setInitialTitle(title);
            setInitialContent(content);
            setHasUnsavedChanges(false);
        } catch (error) {
            alert('Failed to save note: ' + error.message);
        }
    };

    const handleDeleteNote = () => {
        if (!selectedNote) return;
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: { title: selectedNote.title }
        });
    };

    const confirmDeleteNote = async () => {
        try {
            await notesAPI.delete(confirmModal.data.title);
            fetchNotes();
            clearEditor();
        } catch (error) {
            alert('Failed to delete note');
        } finally {
            setConfirmModal({ isOpen: false, type: '', data: null });
        }
    };

    const clearEditor = (force = false) => {
        if (hasUnsavedChanges && !force) {
            setConfirmModal({
                isOpen: true,
                type: 'discard',
                data: null
            });
            return;
        }
        
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setInitialTitle('');
        setInitialContent('');
        setHasUnsavedChanges(false);
    };

    const confirmDiscard = () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        clearEditor(true);
    };

    const handleDownloadNote = () => {
        if (!title || !content) {
            alert('Please enter title and content to download');
            return;
        }

        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${title}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="notes-page">
            <AppHeader title="Notes" />
            <Navbar />
            
            <div className="notes-wrapper">
                {/* Sidebar */}
                <aside className="notes-sidebar">
                    <div className="search-row">
                        <button onClick={clearEditor} title="New Note">+</button>
                        <button onClick={handleDeleteNote} title="Delete">-</button>
                        <button onClick={handleSaveNote} title="Save">S</button>
                        <button onClick={handleDownloadNote} title="Download">D</button>
                    </div>
                    
                    <div className="notes-list">
                        {notes.map(note => (
                            <div
                                key={note.title}
                                className={`note-item ${selectedNote?.title === note.title ? 'active' : ''}`}
                                onClick={() => handleSelectNote(note.title)}
                            >
                                <h4>{note.title}</h4>
                                <small>{new Date(note.updated_at).toLocaleDateString()}</small>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Editor */}
                <main className="notes-main">
                    <div className="mode-toggle">
                        <button
                            className={isPreview ? 'active' : ''}
                            onClick={() => setIsPreview(true)}
                        >
                            Preview
                        </button>
                        <button
                            className={!isPreview ? 'active' : ''}
                            onClick={() => setIsPreview(false)}
                        >
                            Edit
                        </button>
                    </div>

                    <input
                        type="text"
                        className="note-title-input"
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={30}
                    />
                    {hasUnsavedChanges && (
                        <div className="unsaved-indicator">
                            ⚠️ Unsaved changes
                        </div>
                    )}

                    <div className="notes-content">
                        {isPreview ? (
                            <div className="notes-preview">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                className="notes-textarea"
                                placeholder="Write your notes here (Markdown supported)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        )}
                    </div>
                </main>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'delete' ? 'Delete Note' : 'Discard Changes'}
                message={confirmModal.type === 'delete' 
                    ? `Are you sure you want to delete "${confirmModal.data?.title}"?` 
                    : 'You have unsaved changes. Do you want to discard them?'}
                confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Discard'}
                cancelText="Cancel"
                confirmStyle="danger"
                onConfirm={
                    confirmModal.type === 'delete' 
                        ? confirmDeleteNote 
                        : confirmModal.type === 'switch'
                            ? confirmSwitchNote
                            : confirmDiscard
                }
                onCancel={() => {
                    setConfirmModal({ isOpen: false, type: '', data: null });
                    setPendingNoteSelect(null);
                }}
            />
        </div>
    );
};

export default NotesPage;