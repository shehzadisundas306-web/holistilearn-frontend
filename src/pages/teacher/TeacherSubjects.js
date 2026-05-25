import React, { useState, useEffect } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { updateSubjectsAndTopics } from '../../api/teacherApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  BookOpen, 
  FolderTree,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useGetData } from '../../context/userContext';

const TeacherSubjects = () => {
  const { token } = useGetData();
  const { subjects: teacherSubjects, topics: teacherTopics, loadTeacherProfile, profileLoading } = useTeacher();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  
  // ✅ Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'subject' or 'topic'
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load subjects and topics from context
  useEffect(() => {
    if (teacherSubjects && teacherTopics) {
      setSubjects(teacherSubjects);
      setTopics(teacherTopics);
      if (teacherSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(teacherSubjects[0]);
      }
    }
  }, [teacherSubjects, teacherTopics]);

  // Get topics for selected subject
  const getTopicsForSubject = (subject) => {
    return topics.filter(t => t.subject === subject);
  };

  // Add new subject
  const handleAddSubject = async () => {
    if (!newSubject.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    const subjectExists = subjects.some(s => s.toLowerCase() === newSubject.toLowerCase());
    if (subjectExists) {
      toast.error('Subject already exists');
      return;
    }

    const updatedSubjects = [...subjects, newSubject.trim()];
    setSubjects(updatedSubjects);
    setNewSubject('');
    setShowAddSubject(false);
    setSelectedSubject(newSubject.trim());
    
    await saveToBackend(updatedSubjects, topics);
  };

  // Edit subject
  const handleEditSubject = async (oldSubject, newSubjectName) => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    if (newSubjectName !== oldSubject) {
      const subjectExists = subjects.some(s => s.toLowerCase() === newSubjectName.toLowerCase());
      if (subjectExists) {
        toast.error('Subject already exists');
        return;
      }

      const updatedSubjects = subjects.map(s => s === oldSubject ? newSubjectName.trim() : s);
      setSubjects(updatedSubjects);
      
      const updatedTopics = topics.map(t => 
        t.subject === oldSubject ? { ...t, subject: newSubjectName.trim() } : t
      );
      setTopics(updatedTopics);
      
      if (selectedSubject === oldSubject) {
        setSelectedSubject(newSubjectName.trim());
      }
      
      await saveToBackend(updatedSubjects, updatedTopics);
    }
    setEditingSubject(null);
  };

  // ✅ Open delete modal for subject
  const openDeleteSubjectModal = (subject) => {
    const topicCount = getTopicsForSubject(subject).length;
    setDeleteType('subject');
    setDeleteItem({ name: subject, topicCount });
    setShowDeleteModal(true);
  };

  // ✅ Open delete modal for topic
  const openDeleteTopicModal = (topic) => {
    setDeleteType('topic');
    setDeleteItem({ name: topic.topicName, subject: topic.subject });
    setShowDeleteModal(true);
  };

  // ✅ Handle delete confirmation
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    if (deleteType === 'subject') {
      const subject = deleteItem.name;
      
      const updatedSubjects = subjects.filter(s => s !== subject);
      const updatedTopics = topics.filter(t => t.subject !== subject);
      
      setSubjects(updatedSubjects);
      setTopics(updatedTopics);
      
      if (selectedSubject === subject && updatedSubjects.length > 0) {
        setSelectedSubject(updatedSubjects[0]);
      } else if (updatedSubjects.length === 0) {
        setSelectedSubject('');
      }
      
      await saveToBackend(updatedSubjects, updatedTopics);
      toast.success(`"${subject}" deleted successfully`);
      
    } else if (deleteType === 'topic') {
      const { name: topicName, subject } = deleteItem;
      
      const updatedTopics = topics.filter(t => 
        !(t.subject === subject && t.topicName === topicName)
      );
      setTopics(updatedTopics);
      await saveToBackend(subjects, updatedTopics);
      toast.success(`"${topicName}" deleted successfully`);
    }
    
    setIsDeleting(false);
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteType(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteType(null);
    setIsDeleting(false);
  };

  // Add new topic
  const handleAddTopic = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }
    
    if (!newTopic.trim()) {
      toast.error('Please enter a topic name');
      return;
    }

    const topicExists = topics.some(t => 
      t.subject === selectedSubject && t.topicName.toLowerCase() === newTopic.toLowerCase()
    );
    
    if (topicExists) {
      toast.error('Topic already exists in this subject');
      return;
    }

    const updatedTopics = [...topics, { subject: selectedSubject, topicName: newTopic.trim() }];
    setTopics(updatedTopics);
    setNewTopic('');
    setShowAddTopic(false);
    
    await saveToBackend(subjects, updatedTopics);
  };

  // Edit topic
  const handleEditTopic = async (oldTopic, newTopicName) => {
    if (!newTopicName.trim()) {
      toast.error('Please enter a topic name');
      return;
    }

    if (newTopicName !== oldTopic.topicName) {
      const topicExists = topics.some(t => 
        t.subject === selectedSubject && t.topicName.toLowerCase() === newTopicName.toLowerCase()
      );
      
      if (topicExists) {
        toast.error('Topic already exists in this subject');
        return;
      }

      const updatedTopics = topics.map(t => 
        t.subject === selectedSubject && t.topicName === oldTopic.topicName
          ? { ...t, topicName: newTopicName.trim() }
          : t
      );
      setTopics(updatedTopics);
      await saveToBackend(subjects, updatedTopics);
    }
    setEditingTopic(null);
  };

  // Delete topic (legacy - now using modal)
  const handleDeleteTopic = (topic) => {
    openDeleteTopicModal(topic);
  };

  // Save to backend
  const saveToBackend = async (updatedSubjects, updatedTopics) => {
    setLoading(true);
    try {
      const response = await updateSubjectsAndTopics({
        subjects: updatedSubjects,
        topics: updatedTopics
      });
      
      if (response.success) {
        await loadTeacherProfile();
        toast.success('Changes saved successfully');
      } else {
        toast.error(response.message || 'Failed to save changes');
        setSubjects(teacherSubjects || []);
        setTopics(teacherTopics || []);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
      setSubjects(teacherSubjects || []);
      setTopics(teacherTopics || []);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <LoadingSpinner text="Loading your subjects..." />;
  }

  return (
    <div className="teacher-subjects">
      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Header */}
      <div className="subjects-header">
        <div>
          <h1>Subjects & Topics</h1>
          <p>Organize your teaching curriculum by adding subjects and topics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="subjects-topics-container">
        {/* Left Sidebar - Subjects List */}
        <div className="subjects-sidebar">
          <div className="sidebar-header">
            <h2>
              <BookOpen size={18} />
              Your Subjects
            </h2>
            <button 
              className="add-subject-btn"
              onClick={() => setShowAddSubject(true)}
            >
              <Plus size={16} />
              Add Subject
            </button>
          </div>

          <div className="subjects-list">
            {subjects.length === 0 ? (
              <EmptyState
                icon="📚"
                title="No Subjects Added"
                message="Add your first subject to start organizing your curriculum"
                actionText="Add Subject"
                onAction={() => setShowAddSubject(true)}
              />
            ) : (
              subjects.map((subject) => (
                <div
                  key={subject}
                  className={`subject-item ${selectedSubject === subject ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(subject)}
                >
                  {editingSubject === subject ? (
                    <div className="edit-subject-form" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        defaultValue={subject}
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditSubject(subject, e.target.value);
                          }
                        }}
                        onBlur={(e) => handleEditSubject(subject, e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <span className="subject-name">{subject}</span>
                      <div className="subject-actions">
                        <button
                          className="icon-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubject(subject);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="icon-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteSubjectModal(subject);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content - Topics for Selected Subject */}
        <div className="topics-content">
          {selectedSubject ? (
            <>
              <div className="topics-header">
                <div className="header-info">
                  <h2>
                    <FolderTree size={18} />
                    Topics in "{selectedSubject}"
                  </h2>
                  <span className="topic-count">
                    {getTopicsForSubject(selectedSubject).length} topics
                  </span>
                </div>
                <button 
                  className="add-topic-btn"
                  onClick={() => setShowAddTopic(true)}
                >
                  <Plus size={16} />
                  Add Topic
                </button>
              </div>

              <div className="topics-list">
                {getTopicsForSubject(selectedSubject).length === 0 ? (
                  <EmptyState
                    icon="📝"
                    title="No Topics Yet"
                    message={`Add topics under "${selectedSubject}" to structure your curriculum`}
                    actionText="Add Topic"
                    onAction={() => setShowAddTopic(true)}
                  />
                ) : (
                  <div className="topics-grid">
                    {getTopicsForSubject(selectedSubject).map((topic, index) => (
                      <div key={index} className="topic-card">
                        {editingTopic === topic ? (
                          <div className="edit-topic-form">
                            <input
                              type="text"
                              defaultValue={topic.topicName}
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditTopic(topic, e.target.value);
                                }
                              }}
                              onBlur={(e) => handleEditTopic(topic, e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="topic-info">
                              <span className="topic-icon">📖</span>
                              <span className="topic-name">{topic.topicName}</span>
                            </div>
                            <div className="topic-actions">
                              <button
                                className="icon-btn edit"
                                onClick={() => setEditingTopic(topic)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="icon-btn delete"
                                onClick={() => handleDeleteTopic(topic)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-subject-selected">
              <BookOpen size={48} className="icon" />
              <h3>No Subject Selected</h3>
              <p>Select a subject from the left panel or create a new one to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="modal-overlay" onClick={() => setShowAddSubject(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Subject</h2>
              <button className="close-btn" onClick={() => setShowAddSubject(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Physics, Computer Science"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddSubject(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddSubject}>Add Subject</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="modal-overlay" onClick={() => setShowAddTopic(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Topic</h2>
              <button className="close-btn" onClick={() => setShowAddTopic(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject</label>
                <input type="text" value={selectedSubject} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Topic Name</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., Algebra, Newton's Laws, Data Structures"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddTopic(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddTopic}>Add Topic</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Professional Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon warning">
                <AlertTriangle size={24} />
              </div>
              <h3>Confirm Deletion</h3>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>“{deleteItem?.name}”</strong>?
              </p>
              
              {deleteType === 'subject' && deleteItem?.topicCount > 0 && (
                <div className="warning-box">
                  <AlertCircle size={16} />
                  <span>
                    This subject has <strong>{deleteItem.topicCount}</strong> topic(s) associated with it. 
                    They will also be deleted.
                  </span>
                </div>
              )}
              
              <p className="warning-text">
                This action cannot be undone. All data related to this {deleteType === 'subject' ? 'subject' : 'topic'} will be permanently removed.
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelDelete} disabled={isDeleting}>
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Saving changes...</p>
        </div>
      )}
    </div>
  );
};

export default TeacherSubjects;