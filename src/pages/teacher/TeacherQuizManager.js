// frontend/src/pages/teacher/TeacherQuizManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { useGetData } from '../../context/userContext';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import socketService from '../../services/socketService';
import { 
  Plus, FileQuestion, Zap, Clock, Users, TrendingUp,
  ChevronRight, Sparkles, Copy, Trash2, Eye, Edit,
  Calendar, Loader2, CheckCircle, X, ArrowLeft, RefreshCw,
  AlertTriangle
} from 'lucide-react';
import '../../styles/teacher/TeacherQuizManager.css';

const TeacherQuizManager = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'results', 'edit', 'copy', or null
  const { user, token, loading: authLoading } = useGetData();
  const { subjects, classes } = useTeacher();
  
  // Shared state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Quiz list state (default view)
  const [quizzes, setQuizzes] = useState([]);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ✅ Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: '', description: '', classId: '',
    timeLimit: 30, attemptsAllowed: 1, dueDate: '', questions: []
  });
  
  // AI generation form
  const [aiForm, setAiForm] = useState({
    subject: '', topic: '', difficulty: 'medium', numQuestions: 5
  });
  
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [resultsData, setResultsData] = useState(null);

  // ✅ Socket listener for real-time quiz submissions
  useEffect(() => {
    if (!socketService) return;
    
    const handleQuizSubmitted = (data) => {
      console.log('📊 Quiz submitted - refreshing data:', data);
      toast.info(`${data.studentName} submitted "${data.quizTitle}" - Score: ${data.percentage}%`, {
        duration: 5000,
        icon: '📝'
      });
      
      fetchQuizzes();
      
      if (quizId && mode === 'results' && quizId === data.quizId) {
        fetchResults(quizId);
      }
    };
    
    socketService.on('quiz:submitted', handleQuizSubmitted);
    
    return () => {
      socketService.off('quiz:submitted', handleQuizSubmitted);
    };
  }, [quizId, mode]);

  // ========== Helper: Fetch quiz details for edit/copy ==========
  const fetchQuizForEdit = async (id) => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const res = await fetch(`${API_BASE}/api/quizzes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      const quiz = data.data;
      setCurrentQuiz(quiz);
      const qs = quiz.questions.map((q, idx) => ({
        id: idx,
        text: q.question,
        options: q.options,
        correctAnswer: q.options.findIndex(opt => opt === q.correctAnswer),
        explanation: q.explanation,
        points: q.points
      }));
      setEditableQuestions(qs);
      setQuizForm({
        title: quiz.title,
        description: quiz.description || '',
        classId: quiz.classId?._id || quiz.classId || '',
        timeLimit: quiz.timeLimit || 30,
        attemptsAllowed: quiz.maxAttempts || 1,
        dueDate: quiz.dueDate ? quiz.dueDate.split('T')[0] : '',
        questions: qs
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quiz for editing');
      navigate('/teacher/dashboard/quiz');
    } finally {
      setLoading(false);
    }
  };

  // ========== Fetch results for a quiz ==========
  const fetchResults = async (id) => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const res = await fetch(`${API_BASE}/api/quizzes/${id}/results/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResultsData(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quiz results');
      navigate('/teacher/dashboard/quiz');
    } finally {
      setLoading(false);
    }
  };

  // ========== Save edited / copied quiz ==========
  const handleSaveQuiz = async (isCopy = false) => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!quizForm.classId) {
      toast.error('Please select a class');
      return;
    }
    if (editableQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setSaving(true);
    const toastId = toast.loading(isCopy ? 'Copying quiz...' : 'Updating quiz...');
    
    const payload = {
      title: quizForm.title,
      description: quizForm.description,
      classId: quizForm.classId,
      timeLimit: quizForm.timeLimit,
      attemptsAllowed: quizForm.attemptsAllowed,
      dueDate: quizForm.dueDate || null,
      questions: editableQuestions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points
      })),
      topic: currentQuiz?.topic || quizForm.title
    };

    const url = isCopy
      ? `${process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app'}/api/quizzes/${quizId}/copy`
      : `${process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app'}/api/quizzes/${quizId}`;
    const method = isCopy ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(isCopy ? 'Quiz copied successfully!' : 'Quiz updated successfully!', { id: toastId });
        navigate('/teacher/dashboard/quiz');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Save quiz error:', error);
      toast.error(error.message || 'Failed to save quiz', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ========== Fetch quiz list ==========
  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const response = await fetch(`${API_BASE}/api/quizzes/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) setQuizzes(data.quizzes || []);
      else throw new Error(data.message);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError(error.message);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };


  // In TeacherQuizManager.jsx - updated handleAIGenerate
const handleAIGenerate = async () => {
  if (!aiForm.subject || !aiForm.topic) {
    toast.error('Please select subject and topic');
    return;
  }
  
  setGenerating(true);
  const toastId = toast.loading('AI is generating your quiz questions...');
  
  try {
    const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
    const response = await fetch(`${API_BASE}/api/ai/teacher/generate-quiz`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(aiForm)
    });
    
    const data = await response.json();
    console.log('🔍 AI Response:', data);
    
    if (data.success) {
      let rawQuestions = [];
      
      // Check if response has questions in data.data.questions or data.quiz.questions
      if (data.data?.questions) {
        rawQuestions = data.data.questions;
      } else if (data.quiz?.questions) {
        rawQuestions = data.quiz.questions;
      } else if (data.questions) {
        rawQuestions = data.questions;
      }
      
      console.log(`📝 Received ${rawQuestions.length} questions`);
      
      const normalized = rawQuestions.map((q, idx) => {
        // Get options
        const options = Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        
        let correctIndex = 0;
        const correctAnswerValue = q.correctAnswer;
        
        // If correctAnswer is already an index (number)
        if (typeof correctAnswerValue === 'number') {
          correctIndex = Math.min(Math.max(correctAnswerValue, 0), 3);
        } 
        // If correctAnswer is text
        else if (typeof correctAnswerValue === 'string') {
          // Try to find by exact match
          let foundIndex = options.findIndex(opt => opt === correctAnswerValue);
          
          // Try case-insensitive
          if (foundIndex === -1) {
            foundIndex = options.findIndex(opt => 
              opt.toLowerCase() === correctAnswerValue.toLowerCase()
            );
          }
          
          // Try partial match
          if (foundIndex === -1) {
            foundIndex = options.findIndex(opt => 
              opt.toLowerCase().includes(correctAnswerValue.toLowerCase())
            );
          }
          
          // If it's a letter (A, B, C, D)
          if (foundIndex === -1 && /^[A-Da-d]$/.test(correctAnswerValue)) {
            const letterMap = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };
            foundIndex = letterMap[correctAnswerValue] || 0;
          }
          
          correctIndex = foundIndex !== -1 ? foundIndex : 0;
        }
        
        return {
          id: Date.now() + idx,
          text: q.text || q.question || `Question ${idx+1}`,
          options: options,
          correctAnswer: correctIndex,
          explanation: q.explanation || '',
          points: q.points || 10
        };
      });
      
      setEditableQuestions(normalized);
      toast.success(`${normalized.length} questions generated!`, { id: toastId });
      
      if (!quizForm.title) {
        setQuizForm(prev => ({
          ...prev,
          title: `${aiForm.topic} Quiz`
        }));
      }
    } else {
      throw new Error(data.message || 'Failed to generate questions');
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    toast.error(error.message || 'Failed to generate questions.', { id: toastId });
  } finally {
    setGenerating(false);
  }
};

  // ========== Question Editor Functions ==========
  const addQuestion = () => {
    setEditableQuestions([...editableQuestions, {
      id: Date.now(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 10
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...editableQuestions];
    updated[index][field] = value;
    setEditableQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...editableQuestions];
    updated[qIndex].options[optIndex] = value;
    setEditableQuestions(updated);
  };

  const removeQuestion = (index) => {
    setEditableQuestions(editableQuestions.filter((_, i) => i !== index));
  };

  // ========== Save New Quiz ==========
  const saveNewQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!quizForm.classId) {
      toast.error('Please select a class');
      return;
    }
    if (editableQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    
    setSaving(true);
    const toastId = toast.loading('Creating quiz...');
    const quizData = {
      ...quizForm,
      questions: editableQuestions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points
      }))
    };
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const response = await fetch(`${API_BASE}/api/quizzes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(quizData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Quiz created successfully!', { id: toastId });
        setShowCreateModal(false);
        setShowAIModal(false);
        setEditableQuestions([]);
        setQuizForm({ title: '', description: '', classId: '', timeLimit: 30, attemptsAllowed: 1, dueDate: '', questions: [] });
        await fetchQuizzes();
        window.dispatchEvent(new CustomEvent('quiz-created'));
        navigate('/teacher/dashboard/quiz');
      } else {
        toast.error(data.message || 'Failed to create quiz', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save quiz. Please try again.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Open delete modal
  const openDeleteModal = (quiz, e) => {
    e.stopPropagation();
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  // ✅ Handle delete confirmation
  const confirmDelete = async () => {
    if (!quizToDelete) return;
    
    setIsDeleting(true);
    const toastId = toast.loading('Deleting quiz...');
    
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const response = await fetch(`${API_BASE}/api/quizzes/${quizToDelete.id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await response.json();
      
      if (data.success) { 
        toast.success('Quiz deleted successfully', { id: toastId });
        await fetchQuizzes();
        window.dispatchEvent(new CustomEvent('quiz-created'));
        setShowDeleteModal(false);
        setQuizToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete quiz', { id: toastId });
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete quiz', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setQuizToDelete(null);
    setIsDeleting(false);
  };

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuizzes().finally(() => setRefreshing(false));
  };

  // ========== Effects ==========
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (user?.role !== 'teacher') return;

    if (quizId && mode === 'results') {
      fetchResults(quizId);
    } else if (quizId && (mode === 'edit' || mode === 'copy')) {
      fetchQuizForEdit(quizId);
    } else if (!quizId) {
      fetchQuizzes();
    }
  }, [authLoading, token, user, quizId, mode]);

  const openAIModal = () => {
    setEditableQuestions([]);
    setAiForm({ subject: '', topic: '', difficulty: 'medium', numQuestions: 5 });
    setShowAIModal(true);
    setShowCreateModal(true);
  };

  if (authLoading || loading) return <LoadingSpinner text="Loading..." />;
  if (error && !quizId) return <ErrorAlert message={error} onClose={() => setError(null)} />;

  // ----- Results view with enhanced display -----
  if (quizId && mode === 'results' && resultsData) {
    const submissions = resultsData.results || [];
    return (
      <div className="quiz-results-view">
        <div className="view-header">
          <button className="back-btn" onClick={() => navigate('/teacher/dashboard/quiz')}>
            <ArrowLeft size={18} /> Back to Quizzes
          </button>
          <h2>Quiz Results</h2>
          <button onClick={() => fetchResults(quizId)} className="refresh-btn" style={{ marginLeft: 'auto' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        {submissions.length === 0 ? (
          <EmptyState icon="📊" title="No submissions yet" message="Students haven't taken this quiz." />
        ) : (
          <>
            <div className="results-summary">
              <div className="summary-card">
                <h4>Total Submissions</h4>
                <p>{submissions.length}</p>
              </div>
              <div className="summary-card">
                <h4>Average Score</h4>
                <p>{Math.round(submissions.reduce((sum, s) => sum + (s.percentage || s.score || 0), 0) / submissions.length)}%</p>
              </div>
              <div className="summary-card">
                <h4>Highest Score</h4>
                <p>
  {Math.max(
    ...submissions.map(s => Number(s.percentage ?? s.score ?? 0))
  ).toFixed(2)}%
</p>
              </div>
            </div>
            
            {/* <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score (%)</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => (
                    <tr key={sub.studentId || idx}>
                      <td>{sub.studentName || sub.studentId || 'Unknown'}</td>
                      <td className={sub.percentage >= 70 ? 'score-pass' : 'score-fail'}>
                        {Math.round(sub.percentage || sub.score || 0)}%
                      </td>
                      <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div> */}

            <div className="results-table-container">
  <table className="results-table">
    <thead>
      <tr>
        <th>Student</th>
        <th>Score (%)</th>
        <th>Submitted</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {submissions.map((sub, idx) => {
        // Determine if student was deleted
        const isDeletedStudent = sub.studentName === 'Unknown' || !sub.studentName;
        const displayName = sub.studentName || 
                           sub.studentEmail?.split('@')[0] || 
                           sub.studentId?.slice(-6) || 
                           'Deleted User';
        
        return (
          <tr key={sub.studentId || idx} className={isDeletedStudent ? 'deleted-student-row' : ''}>
            <td>
              <div className="student-cell">
                <div className="student-avatar" style={{ 
                  background: isDeletedStudent ? '#9ca3af' : undefined 
                }}>
                  {isDeletedStudent ? '❌' : displayName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <span className="student-name" style={{ 
                  color: isDeletedStudent ? '#9ca3af' : undefined,
                  textDecoration: isDeletedStudent ? 'line-through' : 'none'
                }}>
                  {displayName}
                </span>
                {isDeletedStudent && (
                  <span className="deleted-badge">Deleted</span>
                )}
              </div>
            </td>
            <td className={sub.percentage >= 70 ? 'score-pass' : 'score-fail'}>
              {Math.round(sub.percentage || sub.score || 0)}%
            </td>
            <td>{new Date(sub.submittedAt).toLocaleString()}</td>
            <td>
              {isDeletedStudent ? (
                <span className="status-badge deleted">Account Removed</span>
              ) : (
                <span className="status-badge completed">Completed</span>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div> 
          </>
        )}
      </div>
    );
  }

  // ----- Edit / Copy view -----
  if (quizId && (mode === 'edit' || mode === 'copy') && currentQuiz) {
    const isCopy = mode === 'copy';
    return (
      <div className="quiz-edit-view">
        <div className="view-header">
          <button className="back-btn" onClick={() => navigate('/teacher/dashboard/quiz')}>
            <ArrowLeft size={18} /> Back to Quizzes
          </button>
          <h2>{isCopy ? 'Copy Quiz' : 'Edit Quiz'}</h2>
        </div>
        <div className="edit-form">
          <div className="form-group">
            <label>Quiz Title *</label>
            <input type="text" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={quizForm.description} onChange={e => setQuizForm({...quizForm, description: e.target.value})} rows="2" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select value={quizForm.classId} onChange={e => setQuizForm({...quizForm, classId: e.target.value})}>
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.className}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input type="number" value={quizForm.timeLimit} onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="questions-editor">
            <div className="editor-header">
              <h3>Questions</h3>
              <button className="add-question-btn" onClick={addQuestion}><Plus size={16} /> Add Question</button>
            </div>
            {editableQuestions.map((q, idx) => (
              <div key={q.id} className="question-editor-card">
                <div className="question-header">
                  <span>Question {idx+1}</span>
                  <button className="remove-question-btn" onClick={() => removeQuestion(idx)}><Trash2 size={14} /></button>
                </div>
                <textarea placeholder="Question text" value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value)} rows="2" />
                <div className="options-group">
                  <label>Options</label>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="option-input">
                      <input type="radio" name={`correct-${idx}`} checked={q.correctAnswer === optIdx} onChange={() => updateQuestion(idx, 'correctAnswer', optIdx)} />
                      <input type="text" value={opt} onChange={e => updateOption(idx, optIdx, e.target.value)} placeholder={`Option ${String.fromCharCode(65+optIdx)}`} />
                    </div>
                  ))}
                </div>
                <textarea placeholder="Explanation" value={q.explanation} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} rows="2" />
                <input type="number" placeholder="Points" value={q.points} onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value))} min="1" max="100" />
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => navigate('/teacher/dashboard/quiz')}>Cancel</button>
            <button className="btn-submit" onClick={() => handleSaveQuiz(isCopy)} disabled={saving}>
              {saving ? <Loader2 size={16} className="spinning" /> : <CheckCircle size={16} />}
              {isCopy ? 'Copy Quiz' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- Default: Quiz list view -----
  return (
    <div className="teacher-quiz-manager">
      <div className="quiz-header">
        <div>
          <h1>Quiz Manager</h1>
          <p>Create, manage, and analyze quizzes for your classes</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={openAIModal}>
            <Sparkles size={18} /> Generate with AI
          </button>
        </div>
      </div>

      <div className="quiz-stats">
        <div className="stat-card"><div className="stat-icon purple"><FileQuestion size={20} /></div><div className="stat-info"><h3>{quizzes.length}</h3><p>Total Quizzes</p></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Users size={20} /></div><div className="stat-info"><h3>{quizzes.reduce((sum, q) => sum + (q.submissions || 0), 0)}</h3><p>Total Submissions</p></div></div>
        <div className="stat-card"><div className="stat-icon "><TrendingUp size={20} /></div><div className="stat-info"><h3>{quizzes.length ? Math.round(quizzes.reduce((sum, q) => sum + (q.averageScore || 0), 0) / quizzes.length) : 0}%</h3><p>Avg. Score</p></div></div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState icon="📝" title="No Quizzes Yet" message="Create your first quiz to assess student learning" actionText="Create Quiz" onAction={openAIModal} />
      ) : (
        <div className="quizzes-list">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-item">
              <div className="quiz-info">
                <h3>{quiz.title}</h3>
                <div className="quiz-meta">
                  <span><FileQuestion size={12} /> {quiz.questionCount} questions</span>
                  <span><Users size={12} /> {quiz.submissions} submissions</span>
                  <span><TrendingUp size={12} /> {quiz.averageScore}% avg</span>
                  {quiz.dueDate && <span><Calendar size={12} /> Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="quiz-actions">
                <button className="icon-btn" title="View Results" onClick={() => navigate(`/teacher/dashboard/quiz/${quiz.id}?mode=results`)}><Eye size={16} /></button>
                <button className="icon-btn" title="Edit" onClick={() => navigate(`/teacher/dashboard/quiz/${quiz.id}?mode=edit`)}><Edit size={16} /></button>
                <button className="icon-btn" title="Copy" onClick={() => navigate(`/teacher/dashboard/quiz/${quiz.id}?mode=copy`)}><Copy size={16} /></button>
                <button className="icon-btn delete" title="Delete" onClick={(e) => openDeleteModal(quiz, e)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon warning">
                <AlertTriangle size={24} />
              </div>
              <h3>Delete Quiz</h3>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>“{quizToDelete?.title}”</strong>?
              </p>
              {quizToDelete?.submissions > 0 && (
                <div className="warning-box">
                  <AlertTriangle size={16} />
                  <span>
                    This quiz has <strong>{quizToDelete.submissions}</strong> submission(s). 
                    Deleting it will remove all submission data.
                  </span>
                </div>
              )}
              <p className="warning-text">
                This action cannot be undone. All questions and submissions will be permanently removed.
              </p>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelDelete} disabled={isDeleting}>
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spinning" />
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

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAIModal(false);
          setShowCreateModal(false);
          setEditableQuestions([]);
        }}>
          <div className="modal-content ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Sparkles size={20} /> AI Quiz Generator</h2>
              <button className="close-btn" onClick={() => {
                setShowAIModal(false);
                setShowCreateModal(false);
                setEditableQuestions([]);
              }}>×</button>
            </div>
            
            <div className="modal-body">
              {editableQuestions.length === 0 ? (
                <div className="ai-form">
                  <div className="form-group">
                    <label>Subject *</label>
                    <select value={aiForm.subject} onChange={(e) => setAiForm({...aiForm, subject: e.target.value})}>
                      <option value="">Select Subject</option>
                      {subjects.map((subject, idx) => (<option key={idx} value={subject}>{subject}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Topic *</label>
                    <input type="text" value={aiForm.topic} onChange={(e) => setAiForm({...aiForm, topic: e.target.value})} placeholder="e.g., Newton's Laws, Quadratic Equations" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select value={aiForm.difficulty} onChange={(e) => setAiForm({...aiForm, difficulty: e.target.value})}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of Questions</label>
                      <select value={aiForm.numQuestions} onChange={(e) => setAiForm({...aiForm, numQuestions: parseInt(e.target.value)})}>
                        {[3, 5, 10, 15, 20].map(n => (<option key={n} value={n}>{n} questions</option>))}
                      </select>
                    </div>
                  </div>
                  <button className="generate-btn" onClick={handleAIGenerate} disabled={generating}>
                    {generating ? (<><Loader2 size={18} className="spinning" /> Generating...</>) : (<><Zap size={18} /> Generate Quiz with AI</>)}
                  </button>
                </div>
              ) : (
                <div className="questions-editor">
                  <div className="editor-header">
                    <h3>Edit Questions</h3>
                    <button className="add-question-btn" onClick={addQuestion}><Plus size={16} /> Add Question</button>
                  </div>
                  <div className="questions-list">
                    {editableQuestions.map((question, idx) => (
                      <div key={question.id} className="question-editor-card">
                        <div className="question-header">
                          <span className="question-number">Question {idx + 1}</span>
                          <button className="remove-question-btn" onClick={() => removeQuestion(idx)}><Trash2 size={14} /></button>
                        </div>
                        <textarea placeholder="Question text" value={question.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value)} rows="2" />
                        <div className="options-group">
                          <label>Options</label>
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className="option-input">
                              <input type="radio" name={`correct-${idx}`} checked={question.correctAnswer === optIdx} onChange={() => updateQuestion(idx, 'correctAnswer', optIdx)} />
                              <input type="text" value={option} onChange={(e) => updateOption(idx, optIdx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} className="option-text" />
                            </div>
                          ))}
                        </div>
                        <textarea placeholder="Explanation (Optional)" value={question.explanation} onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)} rows="2" />
                        <input type="number" placeholder="Points" value={question.points} onChange={(e) => updateQuestion(idx, 'points', parseInt(e.target.value))} min="1" max="100" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="quiz-settings">
                    <h3>Quiz Settings</h3>
                    <div className="form-group">
                      <label>Quiz Title *</label>
                      <input type="text" value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} placeholder="e.g., Algebra Mid-Term Assessment" />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={quizForm.description} onChange={(e) => setQuizForm({...quizForm, description: e.target.value})} placeholder="Describe what this quiz covers..." rows="2" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Assign to Class *</label>
                        <select value={quizForm.classId} onChange={(e) => setQuizForm({...quizForm, classId: e.target.value})}>
                          <option value="">Select Class</option>
                          {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.className}</option>))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Time Limit (minutes)</label>
                        <input type="number" value={quizForm.timeLimit} onChange={(e) => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} min="1" max="180" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Attempts Allowed</label>
                        <select value={quizForm.attemptsAllowed} onChange={(e) => setQuizForm({...quizForm, attemptsAllowed: parseInt(e.target.value)})}>
                          <option value="1">1 attempt</option><option value="2">2 attempts</option><option value="3">3 attempts</option><option value="0">Unlimited</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Due Date (Optional)</label>
                        <input type="date" value={quizForm.dueDate} onChange={(e) => setQuizForm({...quizForm, dueDate: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {editableQuestions.length > 0 && (
                <>
                  <button className="btn-cancel" onClick={() => { setEditableQuestions([]); setShowAIModal(false); }}>Cancel</button>
                  <button className="btn-submit" onClick={saveNewQuiz} disabled={saving}>
                    {saving ? (<><Loader2 size={16} className="spinning" /> Saving...</>) : (<><CheckCircle size={16} /> Save Quiz</>)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherQuizManager;