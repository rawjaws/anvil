/**
 * Community Hub Component
 * Social features for template sharing and collaboration
 */

import React, { useState, useEffect } from 'react';
import './CommunityHub.css';

const CommunityHub = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [topTemplates, setTopTemplates] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [userActivity, setUserActivity] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load initial data
    useEffect(() => {
        loadStats();
        loadTopTemplates();
        loadRecommendations();
        loadUserActivity();
    }, []);

    const loadStats = async () => {
        try {
            const response = await fetch('/api/marketplace/stats');
            const result = await response.json();

            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadTopTemplates = async () => {
        try {
            const response = await fetch('/api/marketplace/search?sortBy=rating&pageSize=5');
            const result = await response.json();

            if (result.success) {
                setTopTemplates(result.data.templates);
            }
        } catch (error) {
            console.error('Failed to load top templates:', error);
        }
    };

    const loadRecommendations = async () => {
        try {
            const response = await fetch('/api/marketplace/recommendations/current-user?limit=6');
            const result = await response.json();

            if (result.success) {
                setRecommendations(result.data);
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
    };

    const loadUserActivity = async () => {
        try {
            // Mock user activity data - in real implementation, this would come from backend
            setUserActivity([
                {
                    id: 1,
                    type: 'download',
                    templateName: 'E-commerce User Management',
                    userName: 'Sarah Chen',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    avatar: '👩‍💻'
                },
                {
                    id: 2,
                    type: 'rating',
                    templateName: 'API Gateway Capability',
                    userName: 'Michael Rodriguez',
                    rating: 5,
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                    avatar: '👨‍💼'
                },
                {
                    id: 3,
                    type: 'submit',
                    templateName: 'Healthcare Data Pipeline',
                    userName: 'Dr. Emily Watson',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    avatar: '👩‍⚕️'
                },
                {
                    id: 4,
                    type: 'favorite',
                    templateName: 'Automotive Safety System',
                    userName: 'James Thompson',
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
                    avatar: '🔧'
                }
            ]);
        } catch (error) {
            console.error('Failed to load user activity:', error);
        }
    };

    const renderStats = () => (
        <div className="stats-section">
            <h3>Marketplace Statistics</h3>

            {stats ? (
                <>
                    <div className="stats-grid">
                        <div className="stat-card primary">
                            <div className="stat-number">{stats.totalTemplates}</div>
                            <div className="stat-label">Total Templates</div>
                            <div className="stat-icon">📄</div>
                        </div>

                        <div className="stat-card success">
                            <div className="stat-number">{stats.totalDownloads.toLocaleString()}</div>
                            <div className="stat-label">Downloads</div>
                            <div className="stat-icon">📥</div>
                        </div>

                        <div className="stat-card warning">
                            <div className="stat-number">{stats.totalRatings}</div>
                            <div className="stat-label">Reviews</div>
                            <div className="stat-icon">⭐</div>
                        </div>

                        <div className="stat-card info">
                            <div className="stat-number">{stats.averageRating.toFixed(1)}</div>
                            <div className="stat-label">Avg Rating</div>
                            <div className="stat-icon">📊</div>
                        </div>
                    </div>

                    <div className="category-stats">
                        <h4>Popular Categories</h4>
                        <div className="category-grid">
                            {Object.entries(stats.categoryStats)
                                .sort((a, b) => b[1].templateCount - a[1].templateCount)
                                .slice(0, 6)
                                .map(([categoryId, category]) => (
                                    <div key={categoryId} className="category-card">
                                        <div className="category-name">{category.name}</div>
                                        <div className="category-count">{category.templateCount} templates</div>
                                        <div className="category-rating">
                                            ⭐ {category.averageRating.toFixed(1)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="featured-templates">
                        <h4>Top Rated Templates</h4>
                        <div className="template-list">
                            {stats.topRatedTemplates.map(template => (
                                <div key={template.id} className="template-item">
                                    <div className="template-info">
                                        <div className="template-name">{template.name}</div>
                                        <div className="template-meta">
                                            <span className="template-type">{template.type}</span>
                                            <span className="template-category">{template.category}</span>
                                        </div>
                                    </div>
                                    <div className="template-stats">
                                        <div className="rating">
                                            ⭐ {template.rating.toFixed(1)} ({template.reviewCount})
                                        </div>
                                        <div className="downloads">
                                            📥 {template.downloads}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="loading-placeholder">Loading statistics...</div>
            )}
        </div>
    );

    const renderRecommendations = () => (
        <div className="recommendations-section">
            <h3>Recommended for You</h3>
            <p>Based on your activity and preferences</p>

            {recommendations.length > 0 ? (
                <div className="recommendations-grid">
                    {recommendations.map(template => (
                        <div key={template.id} className="recommendation-card">
                            <div className="recommendation-header">
                                <h4>{template.name}</h4>
                                <div className="recommendation-score">
                                    {template.recommendationScore}% match
                                </div>
                            </div>

                            <div className="recommendation-meta">
                                <span className="type">{template.type}</span>
                                <span className="industry">{template.industry}</span>
                                <span className="complexity">{template.complexity}</span>
                            </div>

                            <p className="recommendation-description">
                                {template.description.substring(0, 100)}...
                            </p>

                            <div className="recommendation-reason">
                                <small>💡 {template.reason}</small>
                            </div>

                            <div className="recommendation-stats">
                                <div className="rating">
                                    ⭐ {template.rating.toFixed(1)} ({template.reviewCount})
                                </div>
                                <div className="downloads">
                                    📥 {template.downloads}
                                </div>
                            </div>

                            <div className="recommendation-actions">
                                <button className="btn-primary">View Details</button>
                                <button className="btn-secondary">Download</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h4>No recommendations yet</h4>
                    <p>Download or rate some templates to get personalized recommendations!</p>
                </div>
            )}
        </div>
    );

    const renderActivity = () => (
        <div className="activity-section">
            <h3>Community Activity</h3>
            <p>See what the community is up to</p>

            <div className="activity-feed">
                {userActivity.map(activity => (
                    <div key={activity.id} className="activity-item">
                        <div className="activity-avatar">{activity.avatar}</div>

                        <div className="activity-content">
                            <div className="activity-text">
                                <strong>{activity.userName}</strong>
                                {activity.type === 'download' && ' downloaded '}
                                {activity.type === 'rating' && ' rated '}
                                {activity.type === 'submit' && ' submitted '}
                                {activity.type === 'favorite' && ' favorited '}
                                <span className="template-link">{activity.templateName}</span>
                                {activity.type === 'rating' && (
                                    <span className="rating-value">
                                        {' '}⭐ {activity.rating}/5
                                    </span>
                                )}
                            </div>

                            <div className="activity-time">
                                {formatTimeAgo(activity.timestamp)}
                            </div>
                        </div>

                        <div className="activity-type">
                            {activity.type === 'download' && '📥'}
                            {activity.type === 'rating' && '⭐'}
                            {activity.type === 'submit' && '📤'}
                            {activity.type === 'favorite' && '❤️'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="activity-actions">
                <button className="btn-outline">Load More Activity</button>
            </div>
        </div>
    );

    const renderLeaderboard = () => (
        <div className="leaderboard-section">
            <h3>Community Leaderboard</h3>
            <p>Top contributors this month</p>

            <div className="leaderboard-tabs">
                <button className="tab-btn active">Contributors</button>
                <button className="tab-btn">Top Rated</button>
                <button className="tab-btn">Most Downloaded</button>
            </div>

            <div className="leaderboard-list">
                {[
                    { rank: 1, name: 'Sarah Chen', avatar: '👩‍💻', contributions: 12, score: 4.8 },
                    { rank: 2, name: 'Michael Rodriguez', avatar: '👨‍💼', contributions: 8, score: 4.7 },
                    { rank: 3, name: 'Dr. Emily Watson', avatar: '👩‍⚕️', contributions: 6, score: 4.9 },
                    { rank: 4, name: 'James Thompson', avatar: '🔧', contributions: 5, score: 4.6 },
                    { rank: 5, name: 'Lisa Park', avatar: '👩‍🎨', contributions: 4, score: 4.5 }
                ].map(user => (
                    <div key={user.rank} className="leaderboard-item">
                        <div className="rank">#{user.rank}</div>
                        <div className="user-avatar">{user.avatar}</div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-stats">
                                {user.contributions} templates • ⭐ {user.score}
                            </div>
                        </div>
                        <div className="achievement">
                            {user.rank === 1 && '🏆'}
                            {user.rank === 2 && '🥈'}
                            {user.rank === 3 && '🥉'}
                            {user.rank > 3 && '⭐'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    const tabs = [
        { id: 'stats', label: 'Overview', icon: '📊' },
        { id: 'recommendations', label: 'For You', icon: '🎯' },
        { id: 'activity', label: 'Activity', icon: '📱' },
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
    ];

    return (
        <div className="community-hub">
            <div className="hub-header">
                <h2>Community Hub</h2>
                <p>Connect, discover, and contribute to the template marketplace</p>
            </div>

            <div className="hub-navigation">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="hub-content">
                {activeTab === 'stats' && renderStats()}
                {activeTab === 'recommendations' && renderRecommendations()}
                {activeTab === 'activity' && renderActivity()}
                {activeTab === 'leaderboard' && renderLeaderboard()}
            </div>

            <div className="hub-actions">
                <div className="action-cards">
                    <div className="action-card">
                        <div className="action-icon">🚀</div>
                        <h4>Share Your Template</h4>
                        <p>Help the community by sharing your best templates</p>
                        <button className="btn-primary">Submit Template</button>
                    </div>

                    <div className="action-card">
                        <div className="action-icon">🔍</div>
                        <h4>Explore Templates</h4>
                        <p>Discover templates created by the community</p>
                        <button className="btn-secondary">Browse Marketplace</button>
                    </div>

                    <div className="action-card">
                        <div className="action-icon">⚡</div>
                        <h4>AI Generator</h4>
                        <p>Create custom templates with AI assistance</p>
                        <button className="btn-outline">Generate Template</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityHub;