// frontend/src/components/AIGenerateNotes.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaDownload, FaSave, FaBook, FaHistory, FaTrash, FaEye, FaTimes, FaChevronLeft, FaChevronRight, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';
import { aiAPI } from '../../../api/ai';
import { toast } from 'sonner';
import '../../../styles/AINotesGenerator.css';

const AIGenerateNotes = () => {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'intermediate',
    includeExamples: true,
    includeQuestions: true,
    customInstructions: ''
  });
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [notesHistory, setNotesHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ show: false, noteId: null, noteTitle: '' });
  const historyLimit = 6;

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: '#10b981' },
    { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
    { value: 'advanced', label: 'Advanced', color: '#ef4444' }
  ];

  useEffect(() => {
    fetchNotesHistory();
  }, [historyPage]);

  const fetchNotesHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await aiAPI.getNotesHistory(historyPage, historyLimit);
      if (response.success) {
        setNotesHistory(response.data.notes);
        setTotalNotes(response.data.total);
        setTotalHistoryPages(Math.ceil(response.data.total / historyLimit));
      }
    } catch (error) {
      console.error('Error fetching notes history:', error);
      setNotesHistory([]);
      setTotalNotes(0);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFullNote = async (noteId) => {
    try {
      setLoadingNote(true);
      const response = await aiAPI.getNote(noteId);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching full note:', error);
      toast.error('Failed to load note details');
      return null;
    } finally {
      setLoadingNote(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await aiAPI.generateNotes(formData);
      
      if (response.success) {
        setGeneratedNotes(response.data);
        toast.success('Notes generated successfully!');
        // Refresh history after generation
        fetchNotesHistory();
      } else {
        toast.error(response.message || 'Failed to generate notes');
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      toast.error(error.message || 'Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!generatedNotes) return;
    
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${generatedNotes.title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #F5C45E; padding-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; }
            h3 { color: #F5C45E; margin-top: 25px; }
            .meta { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .key-point { background: #f9f9f9; padding: 12px; margin: 10px 0; border-left: 4px solid #F5C45E; }
            .code-block { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 15px 0; }
            .question-card { background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .summary { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
            footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; }
          </style>
        </head>
        <body>
          <h1>${generatedNotes.title}</h1>
          <div class="meta">
            <strong>Topic:</strong> ${generatedNotes.topic}<br>
            <strong>Difficulty:</strong> ${generatedNotes.metadata?.difficulty || 'intermediate'}<br>
            <strong>Generated:</strong> ${new Date(generatedNotes.metadata?.generatedAt).toLocaleString()}<br>
            <strong>Reading Time:</strong> ${generatedNotes.metadata?.estimatedReadTime || 5} minutes
          </div>
          
          <h2>Overview</h2>
          <p>${generatedNotes.content?.overview || 'No overview available'}</p>
          
          <h2>Key Concepts</h2>
          ${generatedNotes.content?.keyPoints?.map(point => `
            <div class="key-point">
              <strong>${typeof point === 'string' ? point : point.point}</strong>
              ${point.explanation ? `<p>${point.explanation}</p>` : ''}
            </div>
          `).join('') || '<p>No key points available</p>'}
          
          ${generatedNotes.content?.detailedExplanation?.sections?.map(section => `
            <h2>${section.title}</h2>
            <p>${section.content}</p>
          `).join('') || ''}
          
          ${generatedNotes.content?.codeExamples?.length > 0 ? `
            <h2>Code Examples</h2>
            ${generatedNotes.content.codeExamples.map(ex => `
              <h3>${ex.title}</h3>
              <div class="code-block">
                <code>${ex.code}</code>
              </div>
              <p>${ex.explanation}</p>
            `).join('')}
          ` : ''}
          
          ${generatedNotes.content?.practiceQuestions?.length > 0 ? `
            <h2>Practice Questions</h2>
            ${generatedNotes.content.practiceQuestions.map((q, idx) => `
              <div class="question-card">
                <strong>${idx + 1}. ${q.question}</strong>
                <details>
                  <summary>Show Answer</summary>
                  <p>${q.answer}</p>
                  ${q.hint ? `<p><em>Hint: ${q.hint}</em></p>` : ''}
                </details>
              </div>
            `).join('')}
          ` : ''}
          
          <h2>Summary</h2>
          <div class="summary">
            <p>${generatedNotes.content?.summary || 'No summary available'}</p>
          </div>
          
          <footer>
            Generated by AI Study Assistant | ${new Date().toLocaleDateString()}
          </footer>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedNotes.topic}_notes.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.info('HTML file created. Open in browser and use "Print > Save as PDF" for PDF export');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to export notes');
    }
  };

  const handleViewNote = async (note) => {
    setLoadingNote(true);
    try {
      const fullNote = await fetchFullNote(note.id);
      if (fullNote) {
        setGeneratedNotes(fullNote);
        setShowHistory(false);
      } else {
        setGeneratedNotes(note);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error viewing note:', error);
      setGeneratedNotes(note);
      setShowHistory(false);
    } finally {
      setLoadingNote(false);
    }
  };

  const handleDeleteClick = (noteId, noteTitle) => {
    setDeleteModal({ show: true, noteId, noteTitle });
  };

  const handleConfirmDelete = async () => {
    const { noteId } = deleteModal;
    try {
      const response = await aiAPI.deleteNote(noteId);
      if (response.success) {
        toast.success('Note deleted successfully');
        
        // Refresh the notes list
        await fetchNotesHistory();
        
        // If we're on a page that might become empty, adjust page
        if (notesHistory.length === 1 && historyPage > 1) {
          setHistoryPage(historyPage - 1);
        }
        
        // If the deleted note was currently viewed, clear it
        if (generatedNotes?.id === noteId) {
          setGeneratedNotes(null);
        }
      } else {
        toast.error(response.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete note');
    } finally {
      setDeleteModal({ show: false, noteId: null, noteTitle: '' });
    }
  };

  // Notes Library View
  if (showHistory) {
    return (
      <>
        <motion.div 
          className="ai-notes-dashboard container-fluid p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="row g-0" style={{ minHeight: '85vh' }}>
            <aside className="col-md-3 notes-sidebar p-4">
              <div className="sidebar-content">
                <button 
                  onClick={() => setShowHistory(false)}
                  className="btn btn-outline-gold w-100 mb-4"
                >
                  <FaChevronLeft/> Back to Generator
                </button>
                <h5 className="text-gold mb-4"><FaHistory className="me-2" /> Notes Library</h5>
                <p className="text-gray small">You have {totalNotes} saved note{totalNotes !== 1 ? 's' : ''}</p>
              </div>
            </aside>

            <main className="col-md-9 notes-reader p-5">
              <div className="reader-container">
                <header className="mb-4">
                  <h1 className="display-5 fw-bold text-white">Your Notes Library</h1>
                  <div className="accent-line"></div>
                  <p className="text-light-gray mt-3">Total: {totalNotes} notes</p>
                </header>

                {loadingHistory ? (
                  <div className="text-center py-5">
                    <FaSpinner className="spinner-gold" />
                    <p className="text-gray mt-3">Loading your notes...</p>
                  </div>
                ) : notesHistory.length === 0 ? (
                  <div className="empty-state text-center py-5">
                    <FaBook className="empty-icon" />
                    <h4 className="text-white mt-3">No Notes Yet</h4>
                    <p className="text-gray">Generate your first set of study notes to see them here.</p>
                    <button onClick={() => setShowHistory(false)} className="btn btn-gold-notes mt-3">
                      Create Notes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="notes-grid">
                      {notesHistory.map((note, idx) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="note-card"
                        >
                          <div className="note-card-header">
                            <h5 className="note-title">{note.title}</h5>
                            <span 
                              className="difficulty-tag"
                              style={{ background: difficulties.find(d => d.value === note.metadata?.difficulty)?.color }}
                            >
                              {note.metadata?.difficulty || 'intermediate'}
                            </span>
                          </div>
                          <p className="note-topic">{note.topic}</p>
                          <div className="note-meta">
                            <span className="meta-date">
                              {new Date(note.metadata?.generatedAt).toLocaleDateString()}
                            </span>
                            <span className="meta-readtime">⏱️ {note.metadata?.estimatedReadTime || 5} min</span>
                          </div>
                          <div className="note-actions">
                            <button className="btn-icon-view" onClick={() => handleViewNote(note)} disabled={loadingNote}>
                              {loadingNote ? <FaSpinner className="spinner-small" /> : <FaEye />} View
                            </button>
                            <button className="btn-icon-delete" onClick={() => handleDeleteClick(note.id, note.title)}>
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {totalHistoryPages > 1 && (
                      <div className="pagination-controls mt-4">
                        <button 
                          className="pag-nav" 
                          disabled={historyPage === 1} 
                          onClick={() => setHistoryPage(p => p - 1)}
                        >
                          <FaChevronLeft />
                        </button>
                        <span className="pag-info">Page {historyPage} of {totalHistoryPages}</span>
                        <button 
                          className="pag-nav" 
                          disabled={historyPage === totalHistoryPages} 
                          onClick={() => setHistoryPage(p => p + 1)}
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModal.show && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ show: false, noteId: null, noteTitle: '' })}
            >
              <motion.div 
                className="confirm-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-icon">
                  <FaExclamationTriangle />
                </div>
                <h3>Delete Note</h3>
                <p>Are you sure you want to delete "<strong>{deleteModal.noteTitle}</strong>"? This action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setDeleteModal({ show: false, noteId: null, noteTitle: '' })}>
                    Cancel
                  </button>
                  <button className="btn-confirm-delete" onClick={handleConfirmDelete}>
                    Delete Forever
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Generated Notes View
  if (generatedNotes) {
    return (
      <motion.div 
        className="ai-notes-dashboard container-fluid p-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="row g-0" style={{ minHeight: '85vh' }}>
          <aside className="col-md-3 notes-sidebar p-4">
            <div className="sidebar-content">
              <h5 className="text-gold mb-4"><FaBook className="me-2" /> Study Guide</h5>
              
              <div className="meta-card mb-4">
                <div className="mb-3">
                  <small className="text-gray d-block">DIFFICULTY</small>
                  <span className="fw-bold" style={{ color: '#F5C45E' }}>{generatedNotes.metadata?.difficulty || 'intermediate'}</span>
                </div>
                <div>
                  <small className="text-gray d-block">READING TIME</small>
                  <span className="text-white">{generatedNotes.metadata?.estimatedReadTime || 5} min</span>
                </div>
              </div>

              <div className="export-actions mb-4">
                <label className="text-gold small mb-2 d-block">EXPORT DOCUMENT</label>
                <button onClick={handleExportPDF} className="btn btn-outline-danger w-100 mb-2">
                  <FaFilePdf className="me-2" /> Export as PDF
                </button>
              </div>

              <div className="nav-actions">
                <button onClick={() => setShowHistory(true)} className="btn btn-outline-secondary w-100 mb-2">
                  <FaHistory className="me-2" /> View Library
                </button>
                <button onClick={() => setGeneratedNotes(null)} className="btn btn-danger-custom w-100">
                  <FaBook className="me-2" /> New Session
                </button>
              </div>
            </div>
          </aside>

          <main className="col-md-9 notes-reader p-5">
            <div className="reader-container">
              <header className="mb-5">
                <h1 className="display-5 fw-bold text-white">{generatedNotes.title}</h1>
                <div className="accent-line"></div>
              </header>

              <div className="content-scroll">
                <section className="mb-5">
                  <h3 className="text-gold">Overview</h3>
                  <p className="text-light-gray lead">{generatedNotes.content?.overview || 'No overview available'}</p>
                </section>

                <section className="mb-5">
                  <h3 className="text-gold">Key Concepts</h3>
                  {generatedNotes.content?.keyPoints?.map((point, idx) => (
                    <div key={idx} className="concept-box p-3 mb-3">
                      <strong className="text-white d-block mb-1">{typeof point === 'string' ? point : point.point}</strong>
                      {point.explanation && <p className="text-gray small mb-0">{point.explanation}</p>}
                    </div>
                  ))}
                </section>

                {generatedNotes.content?.detailedExplanation?.sections?.map((section, idx) => (
                  <section key={idx} className="mb-5">
                    <h3 className="text-gold">{section.title}</h3>
                    <p className="text-light-gray">{section.content}</p>
                  </section>
                ))}

                {generatedNotes.content?.codeExamples?.length > 0 && (
                  <section className="mb-5">
                    <h3 className="text-gold">Implementation</h3>
                    {generatedNotes.content.codeExamples.map((ex, idx) => (
                      <div key={idx} className="code-window mt-3">
                        <div className="code-header p-2 px-3 d-flex justify-content-between">
                          <span className="text-gray small">example_{idx + 1}.js</span>
                        </div>
                        <pre className="m-0 p-3"><code>{ex.code}</code></pre>
                        {ex.explanation && <p className="text-gray small mt-2">{ex.explanation}</p>}
                      </div>
                    ))}
                  </section>
                )}

                {generatedNotes.content?.practiceQuestions?.length > 0 && (
                  <section className="mb-5">
                    <h3 className="text-gold">Practice Questions</h3>
                    {generatedNotes.content.practiceQuestions.map((q, idx) => (
                      <div key={idx} className="question-card p-3 mb-3">
                        <p className="text-white fw-bold mb-2">{idx + 1}. {q.question}</p>
                        <details className="mt-2">
                          <summary className="text-gold small">Show Answer</summary>
                          <p className="text-gray  small mt-2">{q.answer}</p>
                          {q.hint && <p className="text-white small mt-1">💡 Hint: {q.hint}</p>}
                        </details>
                      </div>
                    ))}
                  </section>
                )}

                <section className="mb-5">
                  <h3 className="text-gold">Summary</h3>
                  <div className="summary-box p-4">
                    <p className="text-light-gray mb-0">{generatedNotes.content?.summary || 'No summary available'}</p>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </motion.div>
    );
  }

  // Generate Form View
  return (
    <div className="ai-notes-generator">
      <div className="generator-header">
        <button 
          onClick={() => setShowHistory(true)}
          className="btn-history-link"
        >
          <FaHistory /> View Library
        </button>
        <h2>AI Study Notes Generator</h2>
        <p>Generate comprehensive study notes on any topic with AI assistance</p>
      </div>
      
      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-group">
          <label>Topic *</label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="e.g., React Hooks, Machine Learning, Python OOP"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Difficulty Level</label>
          <select className='dropdown' name="difficulty" value={formData.difficulty} onChange={handleChange}>
            {difficulties.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="includeExamples"
              checked={formData.includeExamples}
              onChange={handleChange}
            />
            Include code examples
          </label>
          <label>
            <input
              type="checkbox"
              name="includeQuestions"
              checked={formData.includeQuestions}
              onChange={handleChange}
            />
            Include practice questions
          </label>
        </div>
        
        <div className="form-group">
          <label>Custom Instructions (Optional)</label>
          <textarea
            name="customInstructions"
            value={formData.customInstructions}
            onChange={handleChange}
            placeholder="Any specific focus areas? e.g., 'Focus on practical examples' or 'Include real-world applications'"
            rows="3"
          />
        </div>
        
        <button type="submit" className="generate-btn" disabled={loading}>
          {loading ? <FaSpinner className="spinner" /> : 'Generate Notes'}
        </button>
      </form>
    </div>
  );
};

export default AIGenerateNotes;