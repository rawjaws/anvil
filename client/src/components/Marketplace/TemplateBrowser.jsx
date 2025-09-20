/**
 * Template Browser Component
 * Advanced search and filtering interface for marketplace templates
 */

import React, { useState, useEffect, useCallback } from 'react';
import './TemplateBrowser.css';

const TemplateBrowser = () => {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        industry: '',
        type: '',
        complexity: '',
        minRating: '',
        featured: false,
        verified: false,
        sortBy: 'relevance'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalCount: 0
    });
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Industry options
    const industries = [
        { value: '', label: 'All Industries' },
        { value: 'automotive', label: 'Automotive' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'fintech', label: 'Financial Technology' },
        { value: 'e-commerce', label: 'E-Commerce' },
        { value: 'iot', label: 'Internet of Things' },
        { value: 'saas', label: 'Software as a Service' },
        { value: 'general', label: 'General' }
    ];

    // Type options
    const types = [
        { value: '', label: 'All Types' },
        { value: 'capability', label: 'Capability' },
        { value: 'enabler', label: 'Enabler' }
    ];

    // Complexity options
    const complexities = [
        { value: '', label: 'All Complexity' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
    ];

    // Sort options
    const sortOptions = [
        { value: 'relevance', label: 'Relevance' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'downloads', label: 'Most Downloaded' },
        { value: 'newest', label: 'Newest' },
        { value: 'name', label: 'Name A-Z' }
    ];

    // Load categories on component mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Search templates when query or filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchTemplates();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters, pagination.page]);

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/marketplace/categories');
            const result = await response.json();

            if (result.success) {
                setCategories([
                    { id: '', name: 'All Categories', templateCount: 0 },
                    ...result.data
                ]);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const searchTemplates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                q: searchQuery,
                ...filters,
                page: pagination.page,
                pageSize: pagination.pageSize
            });

            // Remove empty values
            Array.from(params.entries()).forEach(([key, value]) => {
                if (!value || value === 'false') {
                    params.delete(key);
                }
            });

            const response = await fetch(`/api/marketplace/search?${params}`);
            const result = await response.json();

            if (result.success) {
                setTemplates(result.data.templates);
                setPagination(prev => ({
                    ...prev,
                    totalPages: result.data.totalPages,
                    totalCount: result.data.totalCount,
                    hasNextPage: result.data.hasNextPage,
                    hasPreviousPage: result.data.hasPreviousPage
                }));
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleTemplateSelect = async (template) => {
        setSelectedTemplate(template);
        setShowDetails(true);

        // Load full template details
        try {
            const response = await fetch(`/api/marketplace/templates/${template.id}/details`);
            const result = await response.json();

            if (result.success) {
                setSelectedTemplate(result.data);
            }
        } catch (error) {
            console.error('Failed to load template details:', error);
        }
    };

    const handleDownload = async (templateId) => {
        try {
            const response = await fetch(`/api/marketplace/templates/${templateId}/download?userId=current-user`);
            const result = await response.json();

            if (result.success) {
                // Create downloadable file
                const blob = new Blob([result.data.content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${result.data.metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Refresh search to update download count
                searchTemplates();
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleFavorite = async (templateId) => {
        try {
            const response = await fetch(`/api/marketplace/templates/${templateId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: 'current-user' })
            });

            if (response.ok) {
                // Show success message or update UI
                console.log('Added to favorites');
            }
        } catch (error) {
            console.error('Failed to add to favorites:', error);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="star full">★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">★</span>);
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
        }

        return stars;
    };

    const renderPagination = () => {
        const { page, totalPages, hasPreviousPage, hasNextPage } = pagination;
        const pageNumbers = [];

        // Calculate visible page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="pagination">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPreviousPage}
                    className="pagination-btn"
                >
                    Previous
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="pagination-btn"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pageNumbers.map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    >
                        {pageNum}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="pagination-btn"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage}
                    className="pagination-btn"
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <div className="template-browser">
            <div className="browser-header">
                <h2>Template Marketplace</h2>
                <p>Discover and share templates for capabilities and enablers</p>
            </div>

            {/* Search and Filters */}
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    <button className="search-btn">🔍</button>
                </div>

                <div className="filters-row">
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="filter-select"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} {cat.templateCount > 0 && `(${cat.templateCount})`}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.industry}
                        onChange={(e) => handleFilterChange('industry', e.target.value)}
                        className="filter-select"
                    >
                        {industries.map(ind => (
                            <option key={ind.value} value={ind.value}>
                                {ind.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="filter-select"
                    >
                        {types.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.complexity}
                        onChange={(e) => handleFilterChange('complexity', e.target.value)}
                        className="filter-select"
                    >
                        {complexities.map(comp => (
                            <option key={comp.value} value={comp.value}>
                                {comp.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="filter-select"
                    >
                        {sortOptions.map(sort => (
                            <option key={sort.value} value={sort.value}>
                                {sort.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-toggles">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={filters.featured}
                            onChange={(e) => handleFilterChange('featured', e.target.checked)}
                        />
                        Featured Only
                    </label>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={filters.verified}
                            onChange={(e) => handleFilterChange('verified', e.target.checked)}
                        />
                        Verified Only
                    </label>
                </div>
            </div>

            {/* Results Info */}
            <div className="results-info">
                <span>
                    {loading ? 'Searching...' : `${pagination.totalCount} templates found`}
                </span>
            </div>

            {/* Template Grid */}
            <div className="template-grid">
                {loading ? (
                    <div className="loading-spinner">Loading templates...</div>
                ) : templates.length === 0 ? (
                    <div className="no-results">
                        <h3>No templates found</h3>
                        <p>Try adjusting your search criteria or filters</p>
                    </div>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-header">
                                <h3 className="template-title">{template.name}</h3>
                                <div className="template-badges">
                                    {template.featured && <span className="badge featured">Featured</span>}
                                    {template.verified && <span className="badge verified">Verified</span>}
                                </div>
                            </div>

                            <div className="template-meta">
                                <span className="template-type">{template.type}</span>
                                <span className="template-category">{template.category}</span>
                                <span className="template-complexity">{template.complexity}</span>
                            </div>

                            <p className="template-description">{template.description}</p>

                            <div className="template-stats">
                                <div className="rating">
                                    {renderStars(template.rating)}
                                    <span className="rating-text">
                                        {template.rating.toFixed(1)} ({template.reviewCount})
                                    </span>
                                </div>
                                <div className="downloads">
                                    📥 {template.downloads} downloads
                                </div>
                            </div>

                            <div className="template-tags">
                                {template.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                                {template.tags.length > 3 && (
                                    <span className="tag-more">+{template.tags.length - 3}</span>
                                )}
                            </div>

                            <div className="template-actions">
                                <button
                                    onClick={() => handleTemplateSelect(template)}
                                    className="btn-primary"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleDownload(template.id)}
                                    className="btn-secondary"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => handleFavorite(template.id)}
                                    className="btn-icon"
                                    title="Add to favorites"
                                >
                                    ♡
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && renderPagination()}

            {/* Template Details Modal */}
            {showDetails && selectedTemplate && (
                <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedTemplate.name}</h2>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="template-details">
                                <div className="detail-section">
                                    <h3>Overview</h3>
                                    <p>{selectedTemplate.description}</p>
                                </div>

                                <div className="detail-section">
                                    <h3>Metadata</h3>
                                    <div className="metadata-grid">
                                        <div>Type: {selectedTemplate.type}</div>
                                        <div>Category: {selectedTemplate.category}</div>
                                        <div>Industry: {selectedTemplate.industry}</div>
                                        <div>Complexity: {selectedTemplate.complexity}</div>
                                        <div>Version: {selectedTemplate.version}</div>
                                        <div>Quality Score: {selectedTemplate.qualityScore}/100</div>
                                    </div>
                                </div>

                                {selectedTemplate.recentRatings && selectedTemplate.recentRatings.length > 0 && (
                                    <div className="detail-section">
                                        <h3>Recent Reviews</h3>
                                        <div className="reviews-list">
                                            {selectedTemplate.recentRatings.slice(0, 3).map(rating => (
                                                <div key={rating.id} className="review-item">
                                                    <div className="review-rating">
                                                        {renderStars(rating.rating)}
                                                    </div>
                                                    {rating.review && (
                                                        <p className="review-text">{rating.review}</p>
                                                    )}
                                                    <div className="review-date">
                                                        {new Date(rating.created).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => handleDownload(selectedTemplate.id)}
                                className="btn-primary"
                            >
                                Download Template
                            </button>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateBrowser;