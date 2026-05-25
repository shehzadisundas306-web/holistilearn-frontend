// frontend/src/pages/admin/Quizzes.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Trash2, FileQuestion, Users, TrendingUp, Calendar, Clock, Award, School, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getAllQuizzes, deleteQuiz } from '../../api/adminApi';
import StatusBadge from '../../components/admin/common/StatusBadge';
import DeleteModal from '../../components/admin/common/DeleteModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import '../../styles/admin/AdminQuizzes.css';

const Quizzes = () => {
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        totalSubmissions: 0,
        averageScore: 0,
        activeQuizzes: 0
    });

    const itemsPerPage = 20;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch quizzes when dependencies change
    useEffect(() => {
        fetchQuizzes();
    }, [debouncedSearch, difficultyFilter, currentPage]);

    // Calculate stats on mount
    useEffect(() => {
        calculateStats();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const query = {
                page: currentPage,
                limit: itemsPerPage
            };
            
            if (debouncedSearch.trim()) {
                query.search = debouncedSearch.trim();
            }
            
            if (difficultyFilter !== 'all') {
                query.difficulty = difficultyFilter;
            }
            
            const response = await getAllQuizzes(query);
            
            if (response.success) {
                setQuizzes(response.quizzes || []);
                setTotalPages(response.pagination?.pages || 1);
                setTotalCount(response.pagination?.total || 0);
            } else {
                toast.error(response.message || 'Failed to load quizzes');
            }
        } catch (error) {
            console.error('Fetch quizzes error:', error);
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async () => {
        try {
            const response = await getAllQuizzes({ limit: 1000 });
            if (response.success) {
                const allQuizzes = response.quizzes || [];
                const totalSubmissions = allQuizzes.reduce((sum, q) => sum + (q.submissions || 0), 0);
                const avgScore = allQuizzes.length > 0 
                    ? allQuizzes.reduce((sum, q) => sum + (q.averageScore || 0), 0) / allQuizzes.length 
                    : 0;
                
                setStats({
                    totalQuizzes: response.pagination?.total || 0,
                    totalSubmissions: totalSubmissions,
                    averageScore: Math.round(avgScore),
                    activeQuizzes: allQuizzes.filter(q => q.isActive !== false).length
                });
            }
        } catch (error) {
            console.error('Stats calculation error:', error);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!selectedQuiz) return;
        setActionLoading(true);
        try {
            await deleteQuiz(selectedQuiz._id);
            toast.success('Quiz deleted successfully');
            setShowDeleteModal(false);
            setSelectedQuiz(null);
            fetchQuizzes();
            calculateStats();
        } catch (error) {
            toast.error('Failed to delete quiz');
        } finally {
            setActionLoading(false);
        }
    };

    const viewQuizDetails = (quiz) => {
        setSelectedQuiz(quiz);
        setShowDetailsModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDifficultyChange = (e) => {
        setDifficultyFilter(e.target.value);
        setCurrentPage(1);
    };

    const getDifficultyBadgeClass = (difficulty) => {
        switch(difficulty?.toLowerCase()) {
            case 'beginner': return 'difficulty-beginner';
            case 'intermediate': return 'difficulty-intermediate';
            case 'advanced': return 'difficulty-advanced';
            default: return 'difficulty-intermediate';
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch(difficulty?.toLowerCase()) {
            case 'beginner': return 'Beginner';
            case 'intermediate': return 'Intermediate';
            case 'advanced': return 'Advanced';
            default: return 'Intermediate';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 70) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStatsCards = () => [
        { title: 'Total Quizzes', value: stats.totalQuizzes, icon: FileQuestion, color: '#3b82f6' },
        { title: 'Total Submissions', value: stats.totalSubmissions, icon: Users, color: '#10b981' },
        { title: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp, color: '#f59e0b' },
        { title: 'Active Quizzes', value: stats.activeQuizzes, icon: Award, color: '#8b5cf6' }
    ];

    if (loading && quizzes.length === 0) return <LoadingSpinner text="Loading quizzes..." />;

    return (
        <div className="quizzes-page-admin">
            <div className="page-header">
                <h2>Quiz Management</h2>
                <p>Monitor and manage all quizzes created on the platform</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {getStatsCards().map((card, index) => (
                    <div key={index} className="stats-card">
                        <div className="stats-card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                            <card.icon size={24} />
                        </div>
                        <div className="stats-card-info">
                            <h3>{card.value}</h3>
                            <p>{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filter Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search quizzes by title or topic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={16} />
                    <select value={difficultyFilter} onChange={handleDifficultyChange}>
                        <option value="all">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="table-container">
                <div className="table-scroll">
                    <table className="quizzes-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '200px' }}>Quiz Title</th>
                                <th style={{ minWidth: '120px' }}>Topic</th>
                                <th style={{ minWidth: '100px' }}>Difficulty</th>
                                <th style={{ minWidth: '80px' }}>Questions</th>
                                <th style={{ minWidth: '100px' }}>Submissions</th>
                                <th style={{ minWidth: '100px' }}>Avg Score</th>
                                <th style={{ minWidth: '130px' }}>Created By</th>
                                <th style={{ minWidth: '100px' }}>Created</th>
                                <th style={{ minWidth: '80px' }}>Status</th>
                                <th style={{ minWidth: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="empty-row">No quizzes found</td>
                                </tr>
                            ) : (
                                quizzes.map((quiz) => (
                                    <tr key={quiz._id}>
                                        <td>
                                            <div className="quiz-title-cell">
                                                <FileQuestion size={16} className="quiz-icon" />
                                                <span className="quiz-title">{quiz.title}</span>
                                            </div>
                                        </td>
                                        <td>{quiz.topic || 'General'}</td>
                                        <td>
                                            <span className={`difficulty-badge ${getDifficultyBadgeClass(quiz.difficulty)}`}>
                                                {getDifficultyLabel(quiz.difficulty)}
                                            </span>
                                        </td>
                                        <td>{quiz.questionCount || 0}</td>
                                        <td>{quiz.submissions || 0}</td>
                                        <td>
                                            <div className="score-cell">
                                                <div className="score-bar">
                                                    <div 
                                                        className="score-fill"
                                                        style={{ 
                                                            width: `${quiz.averageScore || 0}%`,
                                                            background: getScoreColor(quiz.averageScore || 0)
                                                        }}
                                                    />
                                                </div>
                                                <span className="score-value">{Math.round(quiz.averageScore || 0)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="creator-cell">
                                                <div className="creator-avatar">
                                                    {quiz.createdBy?.name?.charAt(0)?.toUpperCase() || quiz.createdBy?.username?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <span className="creator-name">{quiz.createdBy?.name || quiz.createdBy?.username || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(quiz.createdAt)}</td>
                                        <td><StatusBadge status={quiz.isActive !== false ? 'active' : 'inactive'} /></td>
                                        <td>
                                            <div className="action-buttons-quizzes">
                                                <button 
                                                    className="action-btn view-btn-quizzes"
                                                    onClick={() => viewQuizDetails(quiz)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn delete-btn-quizzes"
                                                    onClick={() => {
                                                        setSelectedQuiz(quiz);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn-quizzes"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="page-numbers">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        className="page-btn-quizzes"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Showing entries info */}
            {totalCount > 0 && (
                <div className="table-info">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                </div>
            )}

            {/* Quiz Details Modal */}
            {showDetailsModal && selectedQuiz && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="quiz-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Quiz Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="quiz-header">
                                <div className="quiz-icon-large">
                                    <FileQuestion size={32} />
                                </div>
                                <div className="quiz-header-info">
                                    <h2>{selectedQuiz.title}</h2>
                                    <div className="quiz-meta">
                                        <span className="topic-tag">{selectedQuiz.topic || 'General'}</span>
                                        <span className={`difficulty-tag ${getDifficultyBadgeClass(selectedQuiz.difficulty)}`}>
                                            {getDifficultyLabel(selectedQuiz.difficulty)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="stats-summary">
                                <div className="stat-badge">
                                    <FileQuestion size={16} />
                                    <span>{selectedQuiz.questionCount || 0} Questions</span>
                                </div>
                                <div className="stat-badge">
                                    <Users size={16} />
                                    <span>{selectedQuiz.submissions || 0} Submissions</span>
                                </div>
                                <div className="stat-badge">
                                    <TrendingUp size={16} />
                                    <span>Avg Score: {Math.round(selectedQuiz.averageScore || 0)}%</span>
                                </div>
                                <div className="stat-badge">
                                    <Clock size={16} />
                                    <span>Time Limit: {selectedQuiz.timeLimit || 30} min</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Creator Information</h4>
                                <div className="creator-info-card">
                                    <div className="creator-avatar-large">
                                        {selectedQuiz.createdBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="creator-details">
                                        <div className="creator-name">{selectedQuiz.createdBy?.name || 'Unknown'}</div>
                                        <div className="creator-email">{selectedQuiz.createdBy?.email || 'No email'}</div>
                                        <StatusBadge status={selectedQuiz.createdBy?.role || 'teacher'} />
                                    </div>
                                </div>
                            </div>

                            {selectedQuiz.description && (
                                <div className="details-section">
                                    <h4>Description</h4>
                                    <p className="quiz-description">{selectedQuiz.description}</p>
                                </div>
                            )}

                            {selectedQuiz.class && (
                                <div className="details-section">
                                    <h4>Assigned Class</h4>
                                    <div className="class-info">
                                        <School size={16} />
                                        <span>{selectedQuiz.class?.className || 'No class assigned'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                            <button 
                                className="btn-delete"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedQuiz(selectedQuiz);
                                    setShowDeleteModal(true);
                                }}
                            >
                                Delete Quiz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteQuiz}
                title="Delete Quiz"
                message={`Are you sure you want to delete "${selectedQuiz?.title}"? This will also delete all submission data for this quiz.`}
                loading={actionLoading}
            />
        </div>
    );
};

export default Quizzes;