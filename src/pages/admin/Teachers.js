// frontend/src/pages/admin/Teachers.jsx
import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Trash2, Clock, UserCheck, Award, Mail, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getPendingTeachers, approveTeacher, rejectTeacher, getTeacherStats, getAllTeachersForAdmin } from '../../api/adminApi';
import StatusBadge from '../../components/admin/common/StatusBadge';
import DeleteModal from '../../components/admin/common/DeleteModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import '../../styles/admin/AdminTeachers.css';

const Teachers = () => {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
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

    useEffect(() => {
        fetchTeachers();
        fetchPendingTeachers();
        fetchStats();
    }, [activeTab, debouncedSearch, currentPage]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const query = {
                page: currentPage,
                limit: itemsPerPage
            };
            
            if (debouncedSearch.trim()) {
                query.search = debouncedSearch.trim();
            }
            
            if (activeTab === 'approved') {
                query.isApproved = true;
            } else if (activeTab === 'pending') {
                query.isApproved = false;
            }
            
            // Use getAllTeachersForAdmin which returns teacher profiles with approval status
            const response = await getAllTeachersForAdmin(query);
            
            if (response.success) {
                setTeachers(response.teachers || []);
                setTotalPages(response.pagination?.pages || 1);
                setTotalCount(response.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Fetch teachers error:', error);
            toast.error('Failed to load teachers');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingTeachers = async () => {
        try {
            const response = await getPendingTeachers();
            if (response.success) {
                setPendingTeachers(response.teachers || []);
            }
        } catch (error) {
            console.error('Fetch pending teachers error:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getTeacherStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Fetch teacher stats error:', error);
        }
    };

    const handleApproveTeacher = async (teacherId) => {
        setActionLoading(true);
        try {
            const response = await approveTeacher(teacherId);
            if (response.success) {
                toast.success('Teacher approved successfully');
                // Refresh all data
                await fetchTeachers();
                await fetchPendingTeachers();
                await fetchStats();
            } else {
                toast.error(response.message || 'Failed to approve teacher');
            }
        } catch (error) {
            console.error('Approve teacher error:', error);
            toast.error(error?.response?.data?.message || 'Failed to approve teacher');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectTeacher = async () => {
        if (!selectedTeacher) return;
        setActionLoading(true);
        try {
            const response = await rejectTeacher(selectedTeacher._id, rejectReason);
            if (response.success) {
                toast.success('Teacher application rejected');
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedTeacher(null);
                await fetchPendingTeachers();
                await fetchStats();
                await fetchTeachers();
            } else {
                toast.error(response.message || 'Failed to reject teacher');
            }
        } catch (error) {
            console.error('Reject teacher error:', error);
            toast.error(error?.response?.data?.message || 'Failed to reject teacher');
        } finally {
            setActionLoading(false);
        }
    };

    const viewTeacherDetails = (teacher) => {
        setSelectedTeacher(teacher);
        setShowDetailsModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatsCards = () => [
        { title: 'Total Teachers', value: stats?.totalTeachers || 0, icon: UserCheck, color: '#3b82f6' },
        { title: 'Approved', value: stats?.approvedTeachers || 0, icon: CheckCircle, color: '#10b981' },
        { title: 'Pending', value: stats?.pendingTeachers || 0, icon: Clock, color: '#f59e0b' },
        { title: 'Approval Rate', value: `${Math.round(stats?.approvalRate || 0)}%`, icon: Award, color: '#8b5cf6' }
    ];

    if (loading && teachers.length === 0) return <LoadingSpinner text="Loading teachers..." />;

    return (
        <div className="teachers-page-admin">
            <div className="page-header">
                <h2>Teacher Management</h2>
                <p>Manage teacher applications and monitor teacher activity</p>
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

            {/* Pending Approvals Section - Cards View */}
            {pendingTeachers.length > 0 && (
                <div className="pending-section">
                    <div className="section-header">
                        <h3>Pending Approvals</h3>
                        <span className="pending-count">{pendingTeachers.length} applications</span>
                    </div>
                    <div className="pending-grid">
                        {pendingTeachers.map((teacher) => (
                            <div key={teacher._id} className="pending-card">
                                <div className="pending-card-header">
                                    <div className="teacher-avatar">
                                        {teacher.userId?.name?.charAt(0)?.toUpperCase() || teacher.userId?.username?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div className="teacher-info">
                                        <h4>{teacher.userId?.name || teacher.userId?.username}</h4>
                                        <p className="teacher-email">{teacher.userId?.email}</p>
                                    </div>
                                </div>
                                <div className="pending-card-body">
                                    <div className="info-row">
                                        <span>Degree:</span>
                                        <strong>{teacher.degree || 'Not specified'}</strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Specialization:</span>
                                        <strong>{teacher.specialization || 'Not specified'}</strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Experience:</span>
                                        <strong>{teacher.experience || 'Not specified'} years</strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Applied:</span>
                                        <strong>{new Date(teacher.createdAt).toLocaleDateString()}</strong>
                                    </div>
                                </div>
                                <div className="pending-card-actions">
                                    <button 
                                        className="approve-btn"
                                        onClick={() => handleApproveTeacher(teacher.userId._id)}
                                        disabled={actionLoading}
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => {
                                            setSelectedTeacher(teacher.userId);
                                            setShowRejectModal(true);
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button 
                                        className="view-btn"
                                        onClick={() => viewTeacherDetails(teacher.userId)}
                                    >
                                        <Eye size={16} /> View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search teachers by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <div className="tab-buttons">
                        <button 
                            className={activeTab === 'all' ? 'active' : ''} 
                            onClick={() => {
                                setActiveTab('all');
                                setCurrentPage(1);
                            }}
                        >
                            All Teachers
                        </button>
                        <button 
                            className={activeTab === 'approved' ? 'active' : ''} 
                            onClick={() => {
                                setActiveTab('approved');
                                setCurrentPage(1);
                            }}
                        >
                            Approved
                        </button>
                        <button 
                            className={activeTab === 'pending' ? 'active' : ''} 
                            onClick={() => {
                                setActiveTab('pending');
                                setCurrentPage(1);
                            }}
                        >
                            Pending
                        </button>
                    </div>
                </div>
            </div>

            {/* Teachers Table */}
            <div className="table-container">
                <div className="table-scroll">
                    <table className="teachers-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '200px' }}>Teacher</th>
                                <th style={{ minWidth: '200px' }}>Email</th>
                                <th style={{ minWidth: '100px' }}>Status</th>
                                <th style={{ minWidth: '100px' }}>Classes</th>
                                <th style={{ minWidth: '120px' }}>Joined</th>
                                <th style={{ minWidth: '140px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-row">No teachers found</td>
                                </tr>
                            ) : (
                                teachers.map((teacher) => {
                                    const isPending = teacher.isApproved === false;
                                    const isApproved = teacher.isApproved === true;
                                    
                                    return (
                                        <tr key={teacher._id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {teacher.name?.charAt(0)?.toUpperCase() || teacher.username?.charAt(0)?.toUpperCase() || 'T'}
                                                    </div>
                                                    <div className="user-meta">
                                                        <h4>{teacher.name || teacher.username}</h4>
                                                        <p>@{teacher.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{teacher.email}</td>
                                            <td>
                                                <StatusBadge status={isApproved ? 'approved' : 'pending'} />
                                            </td>
                                            <td>{teacher.classCount || 0}</td>
                                            <td>{new Date(teacher.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="action-btn view-btn"
                                                        onClick={() => viewTeacherDetails(teacher)}
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    {isPending && (
                                                        <>
                                                            <button 
                                                                className="action-btn approve-btn"
                                                                onClick={() => handleApproveTeacher(teacher._id)}
                                                                disabled={actionLoading}
                                                                title="Approve Teacher"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button 
                                                                className="action-btn reject-btn"
                                                                onClick={() => {
                                    setSelectedTeacher(teacher);
                                    setShowRejectModal(true);
                                }}
                                                                disabled={actionLoading}
                                                                title="Reject Teacher"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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

            {/* Teacher Details Modal */}
            {showDetailsModal && selectedTeacher && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="teacher-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Teacher Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="teacher-profile">
                                <div className="profile-avatar">
                                    {selectedTeacher.name?.charAt(0)?.toUpperCase() || 'T'}
                                </div>
                                <div className="profile-info">
                                    <h4>{selectedTeacher.name || selectedTeacher.username}</h4>
                                    <p className="email"><Mail size={14} /> {selectedTeacher.email}</p>
                                    <StatusBadge status={selectedTeacher.isActive ? 'active' : 'inactive'} />
                                </div>
                            </div>
                            
                            <div className="details-section">
                                <h4>Account Information</h4>
                                <div className="info-grid">
                                    <div><span>Username:</span> {selectedTeacher.username}</div>
                                    <div><span>Role:</span> {selectedTeacher.role}</div>
                                    <div><span>Joined:</span> {new Date(selectedTeacher.createdAt).toLocaleDateString()}</div>
                                    <div><span>Last Login:</span> {selectedTeacher.lastLogin ? new Date(selectedTeacher.lastLogin).toLocaleDateString() : 'Never'}</div>
                                </div>
                            </div>
                            
                            {selectedTeacher.teacherProfile && (
                                <div className="details-section">
                                    <h4>Professional Information</h4>
                                    <div className="info-grid">
                                        <div><span>Degree:</span> {selectedTeacher.teacherProfile.degree || 'N/A'}</div>
                                        <div><span>Specialization:</span> {selectedTeacher.teacherProfile.specialization || 'N/A'}</div>
                                        <div><span>Experience:</span> {selectedTeacher.teacherProfile.experience || '0'} years</div>
                                        <div><span>Bio:</span> {selectedTeacher.teacherProfile.bio || 'No bio provided'}</div>
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

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reject Teacher Application</h3>
                            <button className="close-btn" onClick={() => setShowRejectModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Please provide a reason for rejecting this application:</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows="4"
                            />
                            <p className="warning-text mt-3">This reason will be shared with the teacher.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="btn-reject" onClick={handleRejectTeacher} disabled={actionLoading}>
                                {actionLoading ? 'Rejecting...' : 'Reject Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teachers;