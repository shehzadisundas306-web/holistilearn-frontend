// frontend/src/components/admin/common/AdminTable.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

const AdminTable = ({
    columns,
    data,
    loading = false,
    onRowClick,
    onSort,
    onSearch,
    onFilter,
    searchPlaceholder = "Search...",
    showSearch = true,
    showFilter = true,
    itemsPerPage = 10,
    actions
}) => {
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Handle sorting
    const handleSort = (column) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        if (onSort) {
            onSort(column, newDirection);
        }
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
        if (onSearch) {
            onSearch(value);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    // Get sort icon
    const getSortIcon = (column) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    // Render cell value based on column type
    const renderCellValue = (item, column) => {
        if (column.render) {
            return column.render(item[column.key], item);
        }
        
        const value = item[column.key];
        
        if (column.type === 'badge') {
            return <span className={`status-badge ${value === 'active' ? 'badge-success' : value === 'pending' ? 'badge-warning' : 'badge-default'}`}>
                {value}
            </span>;
        }
        
        if (column.type === 'date') {
            return new Date(value).toLocaleDateString();
        }
        
        if (column.type === 'currency') {
            return `$${value?.toLocaleString()}`;
        }
        
        return value || '-';
    };

    if (loading) {
        return (
            <div style={{
                background: '#0f2a42',
                borderRadius: '20px',
                padding: '60px',
                textAlign: 'center',
                border: '1px solid rgba(245, 196, 94, 0.1)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(245, 196, 94, 0.2)',
                    borderTopColor: '#F5C45E',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p style={{ color: '#94a3b8' }}>Loading data...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            background: '#0f2a42',
            borderRadius: '20px',
            border: '1px solid rgba(245, 196, 94, 0.1)',
            overflow: 'hidden'
        }}>
            {/* Table Header with Search */}
            {(showSearch || showFilter) && (
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(245, 196, 94, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    {showSearch && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(10, 26, 46, 0.6)',
                            border: '1px solid rgba(245, 196, 94, 0.15)',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            minWidth: '250px'
                        }}>
                            <Search size={16} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    )}
                    
                    {showFilter && onFilter && (
                        <button
                            onClick={() => onFilter()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(245, 196, 94, 0.08)',
                                border: '1px solid rgba(245, 196, 94, 0.2)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            <Filter size={14} /> Filter
                        </button>
                    )}
                </div>
            )}
            
            {/* Table */}
            <div style={{  width: '100%',
    overflowX: 'auto',  // This enables horizontal scrolling
    WebkitOverflowScrolling: 'touch' }}>
                <table style={{
                    width: '100%',
                    minWidth: '900px',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            borderBottom: '1px solid rgba(245, 196, 94, 0.1)',
                            background: 'rgba(0, 0, 0, 0.2)'
                        }}>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    onClick={() => column.sortable !== false && handleSort(column.key)}
                                    style={{
                                        textAlign: 'center',
                                        padding: '8px',
                                        color: '#F5C45E',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: column.sortable !== false ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {column.label}
                                        {column.sortable !== false && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                            {actions && <th style={{ padding: '6px', textAlign: 'center', color: '#F5C45E', fontSize: '13px' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} style={{
                                    textAlign: 'center',
                                    padding: '30px',
                                    color: '#94a3b8'
                                }}>
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            currentData.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    style={{
                                        borderBottom: '1px solid rgba(245, 196, 94, 0.05)',
                                        transition: 'all 0.2s ease',
                                        cursor: onRowClick ? 'pointer' : 'default'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(245, 196, 94, 0.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {columns.map((column, colIndex) => (
                                        <td
                                            key={colIndex}
                                            style={{
                                                padding: '16px',
                                                color: '#e5e7eb',
                                                fontSize: '14px',
                                                verticalAlign: 'middle'
                                            }}
                                        >
                                            {renderCellValue(item, column)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(item);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid rgba(245, 196, 94, 0.15)',
                                                            borderRadius: '8px',
                                                            padding: '6px',
                                                            cursor: 'pointer',
                                                            color: action.color || '#94a3b8',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                        title={action.label}
                                                    >
                                                        {action.icon}
                                                        {action.label && <span style={{ fontSize: '12px' }}>{action.label}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(245, 196, 94, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(245, 196, 94, 0.08)',
                                border: '1px solid rgba(245, 196, 94, 0.2)',
                                borderRadius: '8px',
                                color: currentPage === 1 ? '#4b5563' : '#F5C45E',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{
                            padding: '6px 12px',
                            color: '#e5e7eb',
                            fontSize: '13px'
                        }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(245, 196, 94, 0.08)',
                                border: '1px solid rgba(245, 196, 94, 0.2)',
                                borderRadius: '8px',
                                color: currentPage === totalPages ? '#4b5563' : '#F5C45E',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTable;