// frontend/src/pages/admin/Students.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Trash2, UserX, UserCheck, BookOpen, Award, Clock, TrendingUp, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllUsers, updateUserStatus, deleteUser, getStudentStats } from '../../api/adminApi';
import StatusBadge from '../../components/admin/common/StatusBadge';
import DeleteModal from '../../components/admin/common/DeleteModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import '../../styles/admin/AdminUsers.css';

const Students = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 20;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch students when dependencies change
    useEffect(() => {
        fetchStudents();
        fetchStats();
    }, [debouncedSearch, filterStatus, currentPage]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const query = {
                role: 'student',
                page: currentPage,
                limit: itemsPerPage
            };
            
            if (debouncedSearch.trim()) {
                query.search = debouncedSearch.trim();
            }
            
            if (filterStatus !== 'all') {
                query.isActive = filterStatus === 'active';
            }
            
            const response = await getAllUsers(query);
            
            if (response.success) {
                setStudents(response.users || []);
                setTotalPages(response.pagination?.pages || 1);
                setTotalCount(response.pagination?.total || 0);
            } else {
                toast.error(response.message || 'Failed to load students');
            }
        } catch (error) {
            console.error('Fetch students error:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getStudentStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Fetch student stats error:', error);
        }
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;
        setActionLoading(true);
        try {
            await deleteUser(selectedStudent._id);
            toast.success('Student deleted successfully');
            setShowDeleteModal(false);
            setSelectedStudent(null);
            fetchStudents();
            fetchStats();
        } catch (error) {
            toast.error('Failed to delete student');
        } finally {
            setActionLoading(false);
        }
    };

    const viewStudentDetails = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatsCards = () => [
        { title: 'Total Students', value: stats?.totalStudents || 0, icon: BookOpen, color: '#3b82f6' },
        { title: 'Active Students', value: stats?.activeStudents || 0, icon: UserCheck, color: '#10b981' },
        { title: 'Inactive Students', value: stats?.inactiveStudents || 0, icon: UserX, color: '#f59e0b' },
        { title: 'Avg Score', value: `${Math.round(stats?.avgScore || 0)}%`, icon: TrendingUp, color: '#8b5cf6' }
    ];

    if (loading && students.length === 0) return <LoadingSpinner text="Loading students..." />;

    return (
        <div className="students-page-admin">
            <div className="page-header">
                <h2>Student Management</h2>
                <p>Monitor student activity and manage accounts</p>
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
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={filterStatus} onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <div className="table-container">
                <div className="table-scroll">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '200px' }}>Student</th>
                                <th style={{ minWidth: '200px' }}>Email</th>
                                <th style={{ minWidth: '100px' }}>Status</th>
                                <th style={{ minWidth: '80px' }}>Quizzes</th>
                                <th style={{ minWidth: '100px' }}>Avg Score</th>
                                <th style={{ minWidth: '100px' }}>Joined</th>
                                <th style={{ minWidth: '100px' }}>Last Active</th>
                                <th style={{ minWidth: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-row">No students found</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {student.name?.charAt(0)?.toUpperCase() || student.username?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <div className="user-meta">
                                                    <h4>{student.name || student.username}</h4>
                                                    <p>@{student.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{student.email}</td>
                                        <td>
                                            <StatusBadge status={student.isActive ? 'active' : 'blocked'} />
                                        </td>
                                        <td>{student.quizzesTaken || 0}</td>
                                        <td>
                                            <div className="score-cell">
                                                <div className="score-bar">
                                                    <div 
                                                        className="score-fill"
                                                        style={{ 
                                                            width: `${student.averageScore || 0}%`,
                                                            background: (student.averageScore || 0) >= 70 ? '#10b981' : (student.averageScore || 0) >= 50 ? '#f59e0b' : '#ef4444'
                                                        }}
                                                    />
                                                </div>
                                                <span>{Math.round(student.averageScore || 0)}%</span>
                                            </div>
                                        </td>
                                        <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                                        <td>{student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <div className="action-buttons-students">
                                                <button 
                                                    className="action-btn-students view-btn-students"
                                                    onClick={() => viewStudentDetails(student)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                
                                                <button 
                                                    className="action-btn-students delete-btn-students"
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    title="Delete Student"
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

            {/* Student Details Modal */}
            {showDetailsModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="student-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Student Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="student-profile">
                                <div className="profile-avatar">
                                    {selectedStudent.username?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="profile-info">
                                    <h4>{selectedStudent.name || selectedStudent.username}</h4>
                                    <p className="email text-white"><Mail size={14} /> {selectedStudent.email}</p>
                                    <StatusBadge status={selectedStudent.isActive ? 'active' : 'blocked'} />
                                </div>
                            </div>
                            
                            <div className="stats-summary">
                                <div className="stat-badge">
                                    <BookOpen size={16} />
                                    <span>Quizzes: {selectedStudent.quizzesTaken || 0}</span>
                                </div>
                                <div className="stat-badge">
                                    <Award size={16} />
                                    <span>Avg Score: {Math.round(selectedStudent.averageScore || 0)}%</span>
                                </div>
                                <div className="stat-badge">
                                    <Clock size={16} />
                                    <span>Last Active: {selectedStudent.lastActive ? new Date(selectedStudent.lastActive).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>
                            
                            <div className="details-section">
                                <h4>Account Information</h4>
                                <div className="info-grid">
                                    <div><span>Username:</span> {selectedStudent.username}</div>
                                    <div><span>Email:</span> {selectedStudent.email}</div>
                                    <div><span>Joined:</span> {new Date(selectedStudent.createdAt).toLocaleDateString()}</div>
                                    <div><span>Login Count:</span> {selectedStudent.loginCount || 0}</div>
                                </div>
                            </div>
                            
                            {selectedStudent.progress && (
                                <div className="details-section">
                                    <h4>Progress Summary</h4>
                                    <div className="progress-summary">
                                        <div className="progress-item">
                                            <span>Overall Progress</span>
                                            <div className="progress-bar-full">
                                                <div className="progress-fill" style={{ width: `${selectedStudent.progress?.averageScore || 0}%` }} />
                                            </div>
                                            <span className="progress-value">{Math.round(selectedStudent.progress?.averageScore || 0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteStudent}
                title="Delete Student"
                message={`Are you sure you want to delete "${selectedStudent?.name || selectedStudent?.username}"? All their data including quiz history and progress will be permanently removed.`}
                loading={actionLoading}
            />
        </div>
    );
};

export default Students;