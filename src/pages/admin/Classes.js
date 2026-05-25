// frontend/src/pages/admin/Classes.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Trash2, School, Users, BookOpen, Calendar, Clock, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllClasses, deleteClass } from '../../api/adminApi';
import StatusBadge from '../../components/admin/common/StatusBadge';
import DeleteModal from '../../components/admin/common/DeleteModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import '../../styles/admin/AdminClasses.css';

const Classes = () => {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        activeClasses: 0
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

    // Fetch classes when dependencies change
    useEffect(() => {
        fetchClasses();
        calculateStats();
    }, [debouncedSearch, currentPage]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const query = {
                page: currentPage,
                limit: itemsPerPage
            };
            
            if (debouncedSearch.trim()) {
                query.search = debouncedSearch.trim();
            }
            
            const response = await getAllClasses(query);
            
            if (response.success) {
                setClasses(response.classes || []);
                setTotalPages(response.pagination?.pages || 1);
                setTotalCount(response.pagination?.total || 0);
            } else {
                toast.error(response.message || 'Failed to load classes');
            }
        } catch (error) {
            console.error('Fetch classes error:', error);
            toast.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async () => {
        try {
            const response = await getAllClasses({ limit: 1000 });
            if (response.success) {
                const allClasses = response.classes || [];
                const totalStudents = allClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
                const totalQuizzes = allClasses.reduce((sum, cls) => sum + (cls.quizCount || 0), 0);
                
                setStats({
                    totalClasses: response.pagination?.total || 0,
                    totalStudents: totalStudents,
                    totalQuizzes: totalQuizzes,
                    activeClasses: allClasses.filter(c => c.isActive !== false).length
                });
            }
        } catch (error) {
            console.error('Stats calculation error:', error);
        }
    };

    const handleDeleteClass = async () => {
        if (!selectedClass) return;
        setActionLoading(true);
        try {
            await deleteClass(selectedClass._id);
            toast.success('Class deleted successfully');
            setShowDeleteModal(false);
            setSelectedClass(null);
            fetchClasses();
            calculateStats();
        } catch (error) {
            toast.error('Failed to delete class');
        } finally {
            setActionLoading(false);
        }
    };

    const viewClassDetails = (classData) => {
        setSelectedClass(classData);
        setShowDetailsModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        { title: 'Total Classes', value: stats.totalClasses, icon: School, color: '#3b82f6' },
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: '#10b981' },
        { title: 'Total Quizzes', value: stats.totalQuizzes, icon: BookOpen, color: '#f59e0b' },
        { title: 'Active Classes', value: stats.activeClasses, icon: CheckCircle, color: '#8b5cf6' }
    ];

    if (loading && classes.length === 0) return <LoadingSpinner text="Loading classes..." />;

    return (
        <div className="classes-page-admin">
            <div className="page-header">
                <h2>Class Management</h2>
                <p>Monitor and manage all classes across the platform</p>
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

            {/* Search Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search classes by name or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Classes Table */}
            <div className="table-container">
                <div className="table-scroll">
                    <table className="classes-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '180px' }}>Class Name</th>
                                <th style={{ minWidth: '120px' }}>Subject</th>
                                <th style={{ minWidth: '120px' }}>Topic</th>
                                <th style={{ minWidth: '150px' }}>Teacher</th>
                                <th style={{ minWidth: '80px' }}>Students</th>
                                <th style={{ minWidth: '80px' }}>Quizzes</th>
                                <th style={{ minWidth: '100px' }}>Created</th>
                                <th style={{ minWidth: '80px' }}>Status</th>
                                <th style={{ minWidth: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="empty-row">No classes found</td>
                                </tr>
                            ) : (
                                classes.map((classItem) => (
                                    <tr key={classItem._id}>
                                        <td>
                                            <div className="class-cell">
                                                <School size={16} className="class-icon" />
                                                <span className="class-name">{classItem.className}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="subject-badge">{classItem.subject || 'General'}</span>
                                        </td>
                                        <td>{classItem.topic || '-'}</td>
                                        <td>
                                            <div className="teacher-cell">
                                                <div className="teacher-avatar-small">
                                                    {classItem.teacher?.username?.charAt(0)?.toUpperCase() || 'T'}
                                                </div>
                                                <span>{classItem.teacher?.name || classItem.teacher?.username || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="student-count">
                                                <Users size={14} />
                                                <span>{classItem.studentCount || 0}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="quiz-count">
                                                <BookOpen size={14} />
                                                <span>{classItem.quizCount || 0}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(classItem.createdAt)}</td>
                                        <td><StatusBadge status={classItem.isActive !== false ? 'active' : 'inactive'} /></td>
                                        <td>
                                            <div className="action-buttons-classes">
                                                <button 
                                                    className="action-btn-classes view-btn-classes"
                                                    onClick={() => viewClassDetails(classItem)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn-classes delete-btn-classes"
                                                    onClick={() => {
                                                        setSelectedClass(classItem);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    title="Delete Class"
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
                        className="page-btn"
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
                        className="page-btn"
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

            {/* Class Details Modal */}
            {showDetailsModal && selectedClass && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="class-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Class Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="class-header">
                                <div className="class-icon-large">
                                    <School size={32} />
                                </div>
                                <div className="class-header-info">
                                    <h2>{selectedClass.className}</h2>
                                    <div className="class-meta">
                                        <span className="subject-tag">{selectedClass.subject || 'General'}</span>
                                        <span className="topic-tag">{selectedClass.topic || 'No topic'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="stats-summary">
                                <div className="stat-badge">
                                    <Users size={16} />
                                    <span>{selectedClass.studentCount || 0} Students</span>
                                </div>
                                <div className="stat-badge">
                                    <BookOpen size={16} />
                                    <span>{selectedClass.quizCount || 0} Quizzes</span>
                                </div>
                                <div className="stat-badge">
                                    <Calendar size={16} />
                                    <span>Created: {formatDate(selectedClass.createdAt)}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>Teacher Information</h4>
                                <div className="teacher-info-card">
                                    <div className="teacher-avatar-large">
                                        {selectedClass.teacher?.username?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div className="teacher-details">
                                        <div className="teacher-name">{selectedClass.teacher?.username || selectedClass.teacher?.username || 'Unknown'}</div>
                                        <div className="teacher-email">{selectedClass.teacher?.email || 'No email'}</div>
                                        <StatusBadge status={selectedClass.teacher?.isActive !== false ? 'active' : 'inactive'} />
                                    </div>
                                </div>
                            </div>

                            {selectedClass.description && (
                                <div className="details-section">
                                    <h4>Description</h4>
                                    <p className="class-description">{selectedClass.description}</p>
                                </div>
                            )}

                            <div className="details-section">
                                <h4>Recent Activity</h4>
                                <div className="activity-list">
                                    <div className="activity-item">
                                        <Clock size={14} />
                                        <span>Class created on {formatDate(selectedClass.createdAt)}</span>
                                    </div>
                                    {selectedClass.lastActivity && (
                                        <div className="activity-item">
                                            <Clock size={14} />
                                            <span>Last activity: {formatDate(selectedClass.lastActivity)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                            <button 
                                className="btn-delete"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedClass(selectedClass);
                                    setShowDeleteModal(true);
                                }}
                            >
                                Delete Class
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteClass}
                title="Delete Class"
                message={`Are you sure you want to delete "${selectedClass?.className}"? This will also delete all associated quizzes and student enrollments.`}
                loading={actionLoading}
            />
        </div>
    );
};

export default Classes;