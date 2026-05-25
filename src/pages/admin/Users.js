// frontend/src/pages/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import {
    Eye,
    UserX,
    UserCheck,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    Users as UsersIcon,
    GraduationCap,
    ShieldCheck,
    X,
    AlertTriangle,
    Mail,
    Calendar,
    Clock
} from 'lucide-react';

import {
    getAllUsers,
    updateUserStatus,
    deleteUser
} from '../../api/adminApi';

import StatusBadge from '../../components/admin/common/StatusBadge';
import DeleteModal from '../../components/admin/common/DeleteModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { toast } from 'sonner';

import '../../styles/admin/AdminUsers.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);

    const itemsPerPage = 20;

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Users
    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch, roleFilter, statusFilter, currentPage]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const query = {
                page: currentPage,
                limit: itemsPerPage,
            };

            if (debouncedSearch.trim()) {
                query.search = debouncedSearch.trim();
            }

            if (roleFilter !== 'all') {
                query.role = roleFilter;
            }

            if (statusFilter !== 'all') {
                query.isActive = statusFilter === 'active';
            }

            const response = await getAllUsers(query);

            if (response.success) {
                setUsers(response.users || []);
                setTotalPages(response.pagination?.pages || 1);
                setTotalCount(response.pagination?.total || 0);
            } else {
                toast.error(response.message || 'Failed to fetch users');
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

// const handleBlockToggle = async (user) => {
//     try {
//         setActionLoading(true);

//         // If user is active => block => isBlocked = true
//         // If user is blocked => unblock => isBlocked = false
//         const payload = {
//             isBlocked: user.isActive
//         };

//         const response = await updateUserStatus(user._id, payload);

//         if (response.success) {
//             toast.success(response.message);

//             // Update local state immediately
//             setUsers(prevUsers =>
//                 prevUsers.map(u =>
//                     u._id === user._id
//                         ? {
//                             ...u,
//                             isActive: response.user.isActive
//                         }
//                         : u
//                 )
//             );

//             // Update modal data if open
//             if (viewingUser?._id === user._id) {
//                 setViewingUser(prev => ({
//                     ...prev,
//                     isActive: response.user.isActive
//                 }));
//             }

//             // Refresh from server to ensure consistency
//             await fetchUsers();
//         } else {
//             toast.error(response.message || 'Failed to update user status');
//         }

//     } catch (error) {
//         console.error('Block toggle error:', error);
//         toast.error(
//             error?.response?.data?.message ||
//             'Failed to update user status'
//         );
//     } finally {
//         setActionLoading(false);
//     }
// };

const handleBlockToggle = async (user) => {
    try {
        setActionLoading(true);

        const isBlocked = user.isActive; // true = block, false = unblock
        
        console.log('Block Toggle:', {
            userId: user._id,
            currentStatus: user.isActive ? 'Active' : 'Blocked',
            action: isBlocked ? 'Block' : 'Unblock'
        });

        const response = await updateUserStatus(user._id, isBlocked);

        if (response.success) {
            toast.success(response.message);

            // ✅ Update local state immediately
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u._id === user._id
                        ? { ...u, isActive: !user.isActive }
                        : u
                )
            );

            // Update modal data if open
            if (viewingUser?._id === user._id) {
                setViewingUser(prev => ({
                    ...prev,
                    isActive: !user.isActive
                }));
            }

            // ✅ Refresh stats by fetching users again
            await fetchUsers();
        } else {
            toast.error(response.message || 'Failed to update user status');
        }

    } catch (error) {
        console.error('Block toggle error:', error);
        toast.error(
            error?.response?.data?.message ||
            'Failed to update user status'
        );
    } finally {
        setActionLoading(false);
    }
};

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            setActionLoading(true);

            await deleteUser(selectedUser._id);

            toast.success('User deleted successfully');

            setShowDeleteModal(false);
            setSelectedUser(null);

            fetchUsers();

        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewUser = (user) => {
        setViewingUser(user);
        setShowViewModal(true);
    };

    if (loading && users.length === 0) {
        return <LoadingSpinner text="Loading users..." />;
    }

    // Calculate stats
    const totalActiveUsers = users.filter(u => u.isActive).length;
    const totalBlockedUsers = users.filter(u => !u.isActive).length;
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;

    return (
        <div className="admin-users-page">

            {/* Header */}
            <div className="admin-users-header">
                <div>
                    <h2>User Management</h2>
                    <p>Manage all platform users</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-users-stats-grid">
                <div className="admin-users-stats-card">
                    <div className="admin-users-stats-icon total">
                        <UsersIcon size={24} />
                    </div>
                    <div className="admin-users-stats-info">
                        <h3>{totalCount}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="admin-users-stats-card">
                    <div className="admin-users-stats-icon active">
                        <UserCheck size={24} />
                    </div>
                    <div className="admin-users-stats-info">
                        <h3>{totalActiveUsers}</h3>
                        <p>Active Users</p>
                    </div>
                </div>
                <div className="admin-users-stats-card">
                    <div className="admin-users-stats-icon blocked">
                        <UserX size={24} />
                    </div>
                    <div className="admin-users-stats-info">
                        <h3>{totalBlockedUsers}</h3>
                        <p>Blocked Users</p>
                    </div>
                </div>
                <div className="admin-users-stats-card">
                    <div className="admin-users-stats-icon teachers">
                        <GraduationCap size={24} />
                    </div>
                    <div className="admin-users-stats-info">
                        <h3>{totalTeachers}</h3>
                        <p>Teachers</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-users-filters-bar">
                <div className="admin-users-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="admin-users-filter-group">
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="teacher">Teachers</option>
                        <option value="admin">Admins</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="admin-users-table-container">
                <div className="admin-users-table-scroll">
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '200px' }}>User</th>
                                <th style={{ minWidth: '200px' }}>Email</th>
                                <th style={{ minWidth: '100px' }}>Role</th>
                                <th style={{ minWidth: '100px' }}>Status</th>
                                <th style={{ minWidth: '100px' }}>Joined</th>
                                <th style={{ minWidth: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="admin-users-empty-row">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="admin-users-user-cell">
                                                <div className="admin-users-user-avatar">
                                                    {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="admin-users-user-meta">
                                                    <h4>{user.name || user.username}</h4>
                                                    <p>@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <StatusBadge status={user.role} />
                                        </td>
                                        <td>
                                            <StatusBadge status={user.isActive ? 'active' : 'blocked'} />
                                        </td>
                                        <td>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="admin-users-action-buttons">
                                                <button
                                                    className="admin-users-action-btn view"
                                                    onClick={() => handleViewUser(user)}
                                                    title="View User Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    className={`admin-users-action-btn ${user.isActive ? 'block' : 'unblock'}`}
                                                    onClick={() => handleBlockToggle(user)}
                                                    disabled={actionLoading}
                                                    title={user.isActive ? 'Block User' : 'Unblock User'}
                                                >
                                                    {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                                </button>

                                                {user.role !== 'admin' && (
                                                    <button
                                                        className="admin-users-action-btn delete"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
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
                <div className="admin-users-pagination">
                    <button
                        className="admin-users-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="admin-users-page-numbers">
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
                                    className={`admin-users-page-number ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        className="admin-users-page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Showing entries info */}
            {totalCount > 0 && (
                <div className="admin-users-table-info">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                </div>
            )}

            {/* View User Modal */}
            {showViewModal && viewingUser && (
                <div className="admin-users-modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="admin-users-view-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-users-modal-header">
                            <h3>User Details</h3>
                            <button className="admin-users-modal-close" onClick={() => setShowViewModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="admin-users-modal-body">
                            <div className="admin-users-user-profile">
                                <div className="admin-users-profile-avatar">
                                    {viewingUser.name?.charAt(0)?.toUpperCase() || viewingUser.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="admin-users-profile-info">
                                    <h4>{viewingUser.name || viewingUser.username}</h4>
                                    <p><Mail size={14} /> {viewingUser.email}</p>
                                    <StatusBadge status={viewingUser.role} />
                                </div>
                            </div>
                            
                            <div className="admin-users-details-section">
                                <h4>Account Information</h4>
                                <div className="admin-users-info-grid">
                                    <div><span>Username:</span> {viewingUser.username}</div>
                                    <div><span>Email:</span> {viewingUser.email}</div>
                                    <div><span>Role:</span> {viewingUser.role}</div>
                                    <div><span>Status:</span> {viewingUser.isActive ? 'Active' : 'Blocked'}</div>
                                    <div><span>Joined:</span> {new Date(viewingUser.createdAt).toLocaleDateString()}</div>
                                    <div><span>Last Login:</span> {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleDateString() : 'Never'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="admin-users-modal-footer">
                            <button className="admin-users-modal-close-btn" onClick={() => setShowViewModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteUser}
                loading={actionLoading}
                title="Delete User"
                message={`Are you sure you want to delete "${selectedUser?.name || selectedUser?.username}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default Users;