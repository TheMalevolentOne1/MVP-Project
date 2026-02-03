import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { notesAPI } from '../apiHandler';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
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

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSelectNote = useCallback(async (noteTitle) => {
        if (hasUnsavedChanges) {
            if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

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
    }, [hasUnsavedChanges]);

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

    const handleDeleteNote = async () => {
        if (!selectedNote) return;
        
        if (window.confirm(`Delete note "${selectedNote.title}"?`)) {
            try {
                await notesAPI.delete(selectedNote.title);
                fetchNotes();
                clearEditor();
            } catch (error) {
                alert('Failed to delete note');
            }
        }
    };

    const clearEditor = () => {
        if (hasUnsavedChanges) {
            if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }
        
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setInitialTitle('');
        setInitialContent('');
        setHasUnsavedChanges(false);
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
        </div>
    );
};

export default NotesPage;