import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ValidationDashboard.css';

/**
 * Advanced Validation Dashboard for Requirements Precision Engine
 * Displays real-time quality scores and manages custom validation rules
 */
const ValidationDashboard = ({
    requirement = '',
    onAnalysisUpdate,
    autoAnalyze = true,
    showAdvancedMetrics = false
}) => {
    // State management
    const [analysis, setAnalysis] = useState(null);
    const [autoFixes, setAutoFixes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFixes, setSelectedFixes] = useState(new Set());
    const [customRules, setCustomRules] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [appliedFixes, setAppliedFixes] = useState([]);
    const [fixedText, setFixedText] = useState('');

    // Debounced analysis trigger
    const [analysisTimer, setAnalysisTimer] = useState(null);

    // Auto-analyze when requirement changes
    useEffect(() => {
        if (autoAnalyze && requirement.trim()) {
            if (analysisTimer) {
                clearTimeout(analysisTimer);
            }

            const timer = setTimeout(() => {
                performAnalysis(requirement);
            }, 500); // Debounce for 500ms

            setAnalysisTimer(timer);

            return () => {
                if (timer) clearTimeout(timer);
            };
        }
    }, [requirement, autoAnalyze]);

    // Perform requirement analysis
    const performAnalysis = useCallback(async (text) => {
        if (!text.trim()) {
            setAnalysis(null);
            setAutoFixes(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call precision engine API
            const response = await fetch('/api/precision-engine/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    options: {
                        includeAutoFixes: true,
                        customRules: customRules
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const data = await response.json();
            setAnalysis(data.analysis);
            setAutoFixes(data.autoFixes);

            if (onAnalysisUpdate) {
                onAnalysisUpdate(data);
            }

        } catch (err) {
            setError(err.message);
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    }, [customRules, onAnalysisUpdate]);

    // Apply selected auto-fixes
    const applySelectedFixes = useCallback(async () => {
        if (selectedFixes.size === 0) return;

        setLoading(true);
        try {
            const fixesToApply = autoFixes.fixes.filter((_, index) =>
                selectedFixes.has(index)
            );

            const response = await fetch('/api/precision-engine/apply-fixes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: requirement,
                    fixes: fixesToApply
                }),
            });

            if (!response.ok) {
                throw new Error(`Auto-fix failed: ${response.statusText}`);
            }

            const result = await response.json();
            setFixedText(result.fixedText);
            setAppliedFixes(result.appliedFixes);
            setSelectedFixes(new Set());

            // Re-analyze the fixed text
            await performAnalysis(result.fixedText);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedFixes, autoFixes, requirement, performAnalysis]);

    // Quality score color coding
    const getScoreColor = useCallback((score) => {
        if (score >= 90) return '#4CAF50'; // Green
        if (score >= 75) return '#FFC107'; // Yellow
        if (score >= 60) return '#FF9800'; // Orange
        return '#F44336'; // Red
    }, []);

    // Quality score text
    const getScoreText = useCallback((score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Needs Improvement';
    }, []);

    // Memoized quality metrics
    const qualityMetrics = useMemo(() => {
        if (!analysis?.quality) return null;

        return {
            clarity: analysis.quality.clarity?.score || 0,
            specificity: analysis.quality.specificity?.score || 0,
            completeness: analysis.quality.completeness?.score || 0,
            terminology: analysis.terminology?.score || 0,
            overall: analysis.metrics?.qualityScore || 0
        };
    }, [analysis]);

    // Handle fix selection
    const toggleFixSelection = useCallback((index) => {
        const newSelected = new Set(selectedFixes);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedFixes(newSelected);
    }, [selectedFixes]);

    // Render quality score circle
    const QualityScoreCircle = ({ score, label, size = 60 }) => (
        <div className="quality-score-circle" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={(size - 8) / 2}
                    fill="none"
                    stroke="#eee"
                    strokeWidth="4"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={(size - 8) / 2}
                    fill="none"
                    stroke={getScoreColor(score)}
                    strokeWidth="4"
                    strokeDasharray={`${(score / 100) * Math.PI * (size - 8)} ${Math.PI * (size - 8)}`}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <text
                    x={size / 2}
                    y={size / 2 + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={getScoreColor(score)}
                >
                    {score}
                </text>
            </svg>
            <div className="score-label">{label}</div>
        </div>
    );

    // Render overview tab
    const renderOverviewTab = () => (
        <div className="overview-tab">
            {qualityMetrics && (
                <div className="quality-metrics">
                    <div className="overall-score">
                        <QualityScoreCircle
                            score={qualityMetrics.overall}
                            label="Overall Quality"
                            size={100}
                        />
                        <div className="score-text">
                            {getScoreText(qualityMetrics.overall)}
                        </div>
                    </div>

                    <div className="detailed-scores">
                        <QualityScoreCircle
                            score={qualityMetrics.clarity}
                            label="Clarity"
                        />
                        <QualityScoreCircle
                            score={qualityMetrics.specificity}
                            label="Specificity"
                        />
                        <QualityScoreCircle
                            score={qualityMetrics.completeness}
                            label="Completeness"
                        />
                        <QualityScoreCircle
                            score={qualityMetrics.terminology}
                            label="Terminology"
                        />
                    </div>
                </div>
            )}

            {analysis?.suggestions && analysis.suggestions.length > 0 && (
                <div className="quick-insights">
                    <h4>Quick Insights</h4>
                    <ul>
                        {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className={`insight-${suggestion.severity}`}>
                                {suggestion.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

    // Render detailed analysis tab
    const renderAnalysisTab = () => (
        <div className="analysis-tab">
            {analysis?.quality && Object.entries(analysis.quality).map(([category, data]) => (
                <div key={category} className="analysis-category">
                    <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <div className="category-score">
                        Score: <span style={{ color: getScoreColor(data.score) }}>
                            {data.score}/100
                        </span>
                    </div>

                    {data.issues && data.issues.length > 0 && (
                        <div className="issues-list">
                            <h5>Issues:</h5>
                            {data.issues.map((issue, index) => (
                                <div key={index} className={`issue issue-${issue.severity}`}>
                                    <span className="issue-type">{issue.type}</span>
                                    <span className="issue-message">{issue.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {data.metrics && (
                        <div className="metrics">
                            <h5>Metrics:</h5>
                            {Object.entries(data.metrics).map(([metric, value]) => (
                                <div key={metric} className="metric">
                                    <span className="metric-name">{metric}:</span>
                                    <span className="metric-value">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // Render auto-fixes tab
    const renderAutoFixesTab = () => (
        <div className="auto-fixes-tab">
            {autoFixes?.fixes && autoFixes.fixes.length > 0 ? (
                <>
                    <div className="fixes-header">
                        <h4>Suggested Improvements ({autoFixes.fixes.length})</h4>
                        <div className="fixes-summary">
                            <span className="auto-applicable">
                                {autoFixes.summary.autoApplicable} auto-applicable
                            </span>
                            <span className="requires-input">
                                {autoFixes.summary.requiresInput} require input
                            </span>
                        </div>

                        {selectedFixes.size > 0 && (
                            <button
                                className="apply-fixes-btn"
                                onClick={applySelectedFixes}
                                disabled={loading}
                            >
                                Apply {selectedFixes.size} Selected Fix{selectedFixes.size !== 1 ? 'es' : ''}
                            </button>
                        )}
                    </div>

                    <div className="fixes-list">
                        {autoFixes.fixes.map((fix, index) => (
                            <div key={index} className={`fix-item fix-${fix.severity}`}>
                                <div className="fix-header">
                                    <input
                                        type="checkbox"
                                        checked={selectedFixes.has(index)}
                                        onChange={() => toggleFixSelection(index)}
                                        disabled={!fix.autoApplicable && !fix.requiresInput}
                                    />
                                    <span className="fix-type">{fix.type.replace(/_/g, ' ')}</span>
                                    <span className={`fix-severity severity-${fix.severity}`}>
                                        {fix.severity}
                                    </span>
                                    {fix.autoApplicable && (
                                        <span className="auto-badge">AUTO</span>
                                    )}
                                </div>

                                <div className="fix-content">
                                    <div className="fix-reason">{fix.reason}</div>
                                    <div className="fix-suggestion">
                                        <strong>Suggestion:</strong> {fix.suggestion}
                                    </div>
                                    <div className="fix-impact">
                                        <strong>Impact:</strong> {fix.impact}
                                    </div>
                                    <div className="fix-confidence">
                                        Confidence: {Math.round(fix.confidence * 100)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="no-fixes">
                    <p>No automatic fixes available for this requirement.</p>
                </div>
            )}
        </div>
    );

    // Render semantic analysis tab
    const renderSemanticTab = () => (
        <div className="semantic-tab">
            {analysis?.semantic && (
                <div className="semantic-analysis">
                    <h4>Semantic Structure</h4>
                    {Object.entries(analysis.semantic.structure).map(([type, elements]) => (
                        elements.length > 0 && (
                            <div key={type} className="semantic-category">
                                <h5>{type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                                <div className="elements-list">
                                    {elements.map((element, index) => (
                                        <span key={index} className="element-tag">
                                            {element}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            {analysis?.terminology && (
                <div className="terminology-analysis">
                    <h4>Terminology</h4>
                    {analysis.terminology.termsFound && analysis.terminology.termsFound.length > 0 ? (
                        <div className="terms-found">
                            <h5>Identified Terms:</h5>
                            <div className="terms-list">
                                {analysis.terminology.termsFound.map((term, index) => (
                                    <span key={index} className="term-tag">
                                        {term}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p>No standard terminology identified.</p>
                    )}
                </div>
            )}
        </div>
    );

    // Main render
    return (
        <div className="validation-dashboard">
            <div className="dashboard-header">
                <h3>Requirements Precision Engine</h3>
                <div className="dashboard-controls">
                    <button
                        className="analyze-btn"
                        onClick={() => performAnalysis(requirement)}
                        disabled={loading || !requirement.trim()}
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <span>Analyzing requirement...</span>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {analysis && (
                <div className="dashboard-content">
                    <div className="tab-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analysis')}
                        >
                            Detailed Analysis
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'fixes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fixes')}
                        >
                            Auto-Fixes {autoFixes?.fixes?.length ? `(${autoFixes.fixes.length})` : ''}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'semantic' ? 'active' : ''}`}
                            onClick={() => setActiveTab('semantic')}
                        >
                            Semantic Analysis
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'analysis' && renderAnalysisTab()}
                        {activeTab === 'fixes' && renderAutoFixesTab()}
                        {activeTab === 'semantic' && renderSemanticTab()}
                    </div>
                </div>
            )}

            {fixedText && (
                <div className="fixed-text-preview">
                    <h4>Applied Fixes Preview</h4>
                    <div className="fixed-text">{fixedText}</div>
                    <div className="applied-fixes-list">
                        <h5>Applied Fixes:</h5>
                        {appliedFixes.map((fix, index) => (
                            <div key={index} className="applied-fix">
                                {fix.type}: {fix.reason}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showAdvancedMetrics && analysis?.metrics && (
                <div className="advanced-metrics">
                    <h4>Advanced Metrics</h4>
                    <div className="metrics-grid">
                        <div className="metric">
                            <span>Processing Time:</span>
                            <span>{analysis.metrics.processingTime}ms</span>
                        </div>
                        <div className="metric">
                            <span>Word Count:</span>
                            <span>{analysis.quality?.clarity?.metrics?.wordCount || 0}</span>
                        </div>
                        <div className="metric">
                            <span>Sentence Count:</span>
                            <span>{analysis.quality?.clarity?.metrics?.sentenceCount || 0}</span>
                        </div>
                        <div className="metric">
                            <span>Avg Words/Sentence:</span>
                            <span>{Math.round(analysis.quality?.clarity?.metrics?.avgWordsPerSentence || 0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationDashboard;