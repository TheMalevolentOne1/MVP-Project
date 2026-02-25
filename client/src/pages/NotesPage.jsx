import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

import { FiPlus, FiTrash2, FiSave, FiDownload, FiEdit, FiEye } from 'react-icons/fi'; // Source: https://react-icons.github.io/react-icons/

import { notesAPI } from '../apiHandler';
import { useTheme } from '../hooks/useTheme';

import tfidfSearch from '../tfidf';

import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

import './NotesPage.css';

/*
Brief: Notes page component for creating, editing, deleting, and searching markdown notes with preview mode.

@Returns: JSX.Element
@ReturnT: Renders the notes editor with sidebar and preview/edit modes.
*/
const NotesPage = () => {
    const location = useLocation();

    // eslint-disable-next-line no-unused-vars
    const { theme } = useTheme();

    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [initialTitle, setInitialTitle] = useState('');
    const [initialContent, setInitialContent] = useState('');
    const [isPreview, setIsPreview] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
    const [pendingNoteSelect, setPendingNoteSelect] = useState(null);

    // True when current note differs from last saved state
    const hasUnsavedChanges = title !== initialTitle || content !== initialContent;

    // Filtered notes derived from search query — no extra state needed
    const filteredNotes = searchQuery ? tfidfSearch(searchQuery, notes) : notes;
    
    /*
    Brief: Fetch all notes from the API and populate the notes list.
    
    @ReturnT: Notes are loaded and state is updated.
    */
    const fetchNotes = useCallback(async () => {
        try {
            const { data } = await notesAPI.getAll();
            if (data.success) {
                setNotes(data.notes);
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        }
    }, []);

    /*
    Brief: Load a specific note by title and populate the editor.
    
    @Param1: noteTitle - The title of the note to load.
    
    @ReturnT: Note is loaded and editor is populated with the note data.
    */
    const loadNote = useCallback(async (noteTitle) => {
        try {
            const { data } = await notesAPI.getByTitle(noteTitle);
            if (data.success) {
                setSelectedNote(data.note);
                setTitle(data.note.title);
                setContent(data.note.content);
                setInitialTitle(data.note.title);
                setInitialContent(data.note.content);
            }
        } catch (error) {
            console.error('Failed to load note:', error);
        }
    }, []);

    /*
    Brief: Handle selecting a note, showing confirmation dialog if there are unsaved changes.
    
    @Param1: noteTitle - The title of the note to select.
    
    @ReturnT: Note is loaded or confirmation dialog is shown.
    */
    const handleSelectNote = useCallback(async (noteTitle) => {
        if (hasUnsavedChanges) {
            setPendingNoteSelect(noteTitle);
            setConfirmModal({ isOpen: true, type: 'switch', data: null });
            return;
        }
        await loadNote(noteTitle);
    }, [hasUnsavedChanges, loadNote]);

    /*
    Brief: Save the current note to the API and update initial state to reflect saved state.

    @ReturnT: Note is saved and unsaved indicator is cleared.
    @ReturnF: Error toast is shown if save fails.
    */
    const handleSaveNote = useCallback(async () => {
        if (!title || !content) {
            toast.error('Please enter title and content');
            return;
        }

        try {
            if (selectedNote) {
                await notesAPI.update(selectedNote.title, title, content);
            } else {
                await notesAPI.create(title, content);
            }
            await fetchNotes();
            setInitialTitle(title);
            setInitialContent(content);
            toast.success('Note saved!');
        } catch (error) {
            toast.error('Failed to save note: ' + error.message);
        }
    }, [title, content, selectedNote, fetchNotes]);

    /*
    Brief: Fetch notes on component mount.
    */
    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    /*
    Brief: Load a note from URL parameters if provided.
    */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const noteTitle = params.get('note');
        if (noteTitle && notes.length > 0) {
            handleSelectNote(noteTitle);
        }
    }, [location.search, notes, handleSelectNote]);

    /*
    Brief: Warn before leaving with unsaved changes.
    */
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

    /*
    Brief: Register keyboard shortcut Ctrl+S to save note.
    */
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
    }, [title, content, handleSaveNote]);

    /*
    Brief: Handle search input change.
    
    @Param1: e - The change event from the search input.
    */
    const handleSearch = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    /*
    Brief: Delete the selected note after confirmation.
    
    @ReturnT: Note is deleted, notes list is refreshed, and editor is cleared.
    @ReturnF: Error toast is shown if delete fails.
    */
    const handleDeleteNote = useCallback(() => {
        if (!selectedNote) return;
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: { title: selectedNote.title }
        });
    }, [selectedNote]);

    /*
    Brief: Download the current note as a markdown file.
    
    @ReturnT: Note is downloaded as .md file.
    @ReturnF: Error toast is shown if validation fails.
    */
    const handleDownloadNote = useCallback(() => {
        if (!title || !content) {
            toast.error('Please enter title and content to download');
            return;
        }

        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${title}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success('Note downloaded');
    }, [title, content]);

    /*
    Brief: Clear the editor and optionally require confirmation for unsaved changes.
    
    @Param1: force - If true, skip unsaved changes check.
    */
    const clearEditor = useCallback((force = false) => {
        if (hasUnsavedChanges && !force) {
            setConfirmModal({ isOpen: true, type: 'discard', data: null });
            return;
        }

        setSelectedNote(null);
        setTitle('');
        setContent('');
        setInitialTitle('');
        setInitialContent('');
    }, [hasUnsavedChanges]);

    /*
    Brief: Confirm switching to a pending note after discarding unsaved changes.
    
    @ReturnT: Pending note is loaded.
    */
    const confirmSwitchNote = useCallback(async () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        if (pendingNoteSelect) {
            await loadNote(pendingNoteSelect);
            setPendingNoteSelect(null);
        }
    }, [pendingNoteSelect, loadNote]);

    /*
    Brief: Confirm and execute note deletion.
    
    @ReturnT: Note is deleted and editor is cleared.
    @ReturnF: Error toast is shown if delete fails.
    */
    const confirmDeleteNote = useCallback(async () => {
        try {
            await notesAPI.delete(confirmModal.data.title);
            await fetchNotes();
            clearEditor(true);
            toast.success('Note deleted');
        } catch (error) {
            toast.error('Failed to delete note');
        } finally {
            setConfirmModal({ isOpen: false, type: '', data: null });
        }
    }, [confirmModal.data, fetchNotes, clearEditor]);

    /*
    Brief: Confirm discarding unsaved changes.
    */
    const confirmDiscard = useCallback(() => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        clearEditor(true);
    }, [clearEditor]);

    /*
    Brief: Close the confirmation modal without taking action.
    */
    const closeModal = useCallback(() => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        setPendingNoteSelect(null);
    }, []);

    return (
        <div className="notes-page">
            <AppHeader title="Notes" />
            <Navbar />

            <div className="notes-wrapper">
                {/* Sidebar */}
                <aside className="notes-sidebar">
                    <div className="search-row">
                        <button onClick={() => clearEditor()} title="New Note"><FiPlus /></button>
                        <button onClick={handleDeleteNote} title="Delete"><FiTrash2 /></button>
                        <button onClick={handleSaveNote} title="Save"><FiSave /></button>
                        <button onClick={handleDownloadNote} title="Download"><FiDownload /></button>
                    </div>

                    <input
                        type="text"
                        className="notes-search-input"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />

                    <div className="notes-list">
                        {
                            (searchQuery ? filteredNotes.filter(note => note.score > 0) : filteredNotes).length === 0 ? (
                                <p className="no-results">No matching notes</p>
                            ) : (
                                (searchQuery ? filteredNotes.filter(note => note.score > 0) : filteredNotes).map(note => (
                                    <div
                                        key={note.title}
                                        className={`note-item ${selectedNote?.title === note.title ? 'active' : ''}`}
                                        onClick={() => handleSelectNote(note.title)}
                                    >
                                        <h4>{note.title}</h4>
                                        <small>{new Date(note.updated_at).toLocaleDateString()}</small>
                                    </div>
                                ))
                            )
                        }
                    </div>
                </aside>

                {/* Editor */}
                <main className="notes-main">
                    <div className="mode-toggle">
                        <button
                            className={isPreview ? 'active' : ''}
                            onClick={() => setIsPreview(true)}
                        >
                            <FiEye /> Preview
                        </button>
                        <button
                            className={!isPreview ? 'active' : ''}
                            onClick={() => setIsPreview(false)}
                        >
                            <FiEdit /> Edit
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
                        <div className="unsaved-indicator">⚠️ Unsaved changes</div>
                    )}

                    <div className="notes-content">
                        {isPreview ? (
                            <div className="notes-preview">
                                {/* Source: https://stackoverflow.com/questions/71907116/react-markdown-and-react-syntax-highlighter */}
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <SyntaxHighlighter
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        img({ src, alt, ...properties }) {
                                            return (
                                                <img
                                                    src={src}
                                                    alt={alt || 'Image'}
                                                    className="notes-image"
                                                    {...properties}
                                                />
                                            );
                                        }
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
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
                message={
                    confirmModal.type === 'delete'
                        ? `Are you sure you want to delete "${confirmModal.data?.title}"?`
                        : 'You have unsaved changes. Do you want to discard them?'
                }
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
                onCancel={closeModal}
            />
        </div>
    );
};

export default NotesPage;