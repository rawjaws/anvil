/**
 * Advanced Market Metrics Visualizer
 * Real-time interactive charts with market intelligence
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Zap, Target, AlertTriangle } from 'lucide-react';
import './MarketMetricsVisualizer.css';

// Advanced Chart Components
function RealTimeMetricsChart({ data, height = 200 }) {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data) {
      setChartData(prev => [...prev.slice(-50), data]); // Keep last 50 points
    }
  }, [data]);

  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart configuration
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const values = chartData.map(d => d.value || 0);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw chart line
    if (chartData.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      chartData.forEach((point, index) => {
        const x = padding + (chartWidth / (chartData.length - 1)) * index;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      ctx.fillStyle = '#3b82f6';
      chartData.forEach((point, index) => {
        const x = padding + (chartWidth / (chartData.length - 1)) * index;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw value labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (valueRange / 5) * i;
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(value.toFixed(1), padding - 10, y);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    const now = new Date();
    for (let i = 0; i <= 5; i++) {
      const timeOffset = (5 - i) * 10; // 10 second intervals
      const time = new Date(now - timeOffset * 1000);
      const x = padding + (chartWidth / 5) * i;
      ctx.fillText(
        time.toLocaleTimeString().split(':').slice(1).join(':'),
        x,
        height - 10
      );
    }

  }, [chartData, height]);

  return (
    <div className="realtime-chart">
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}

function MarketTrendIndicator({ trend, confidence, change }) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'bullish':
      case 'growth':
        return <TrendingUp className="trend-icon bullish" />;
      case 'bearish':
      case 'decline':
        return <TrendingDown className="trend-icon bearish" />;
      default:
        return <Activity className="trend-icon neutral" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'bullish':
      case 'growth':
        return 'bullish';
      case 'bearish':
      case 'decline':
        return 'bearish';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={`market-trend-indicator ${getTrendColor()}`}>
      <div className="trend-header">
        {getTrendIcon()}
        <span className="trend-label">{trend.toUpperCase()}</span>
      </div>
      <div className="trend-metrics">
        <div className="trend-metric">
          <span className="metric-label">Confidence</span>
          <span className="metric-value">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="trend-metric">
          <span className="metric-label">Change</span>
          <span className={`metric-value ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function CompetitivePositioningChart({ data }) {
  if (!data || !data.competitors) return null;

  const maxMarketShare = Math.max(...data.competitors.map(c => c.marketShare));

  return (
    <div className="competitive-positioning">
      <h4>Competitive Positioning</h4>
      <div className="positioning-chart">
        {data.competitors.map((competitor, index) => {
          const width = (competitor.marketShare / maxMarketShare) * 100;
          const isOurCompany = competitor.isUs;

          return (
            <div key={index} className="competitor-bar">
              <div className="competitor-info">
                <span className={`competitor-name ${isOurCompany ? 'our-company' : ''}`}>
                  {competitor.name}
                  {isOurCompany && <span className="our-indicator">(Us)</span>}
                </span>
                <span className="market-share">{competitor.marketShare}%</span>
              </div>
              <div className="market-share-bar">
                <div
                  className={`share-fill ${isOurCompany ? 'our-share' : 'competitor-share'}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityHeatmap({ opportunities }) {
  if (!opportunities || opportunities.length === 0) return null;

  const maxImpact = Math.max(...opportunities.map(o => o.impact));

  return (
    <div className="opportunity-heatmap">
      <h4>Market Opportunities</h4>
      <div className="heatmap-grid">
        {opportunities.map((opportunity, index) => {
          const intensity = opportunity.impact / maxImpact;
          const heatLevel = Math.floor(intensity * 5);

          return (
            <div
              key={index}
              className={`opportunity-cell heat-${heatLevel}`}
              title={`${opportunity.name}: ${opportunity.impact} impact`}
            >
              <div className="opportunity-name">{opportunity.name}</div>
              <div className="opportunity-metrics">
                <span className="opportunity-probability">
                  {Math.round(opportunity.probability * 100)}%
                </span>
                <span className="opportunity-timeline">{opportunity.timeline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskAssessmentRadar({ risks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !risks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Risk categories
    const categories = Object.keys(risks);
    const values = Object.values(risks);
    const angleStep = (2 * Math.PI) / categories.length;

    // Draw radar grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw category lines
    categories.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Draw risk data
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;

    ctx.beginPath();
    values.forEach((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (value * radius) / 100; // Assuming values are 0-100
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw category labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    categories.forEach((category, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelDistance = radius + 20;
      const x = centerX + Math.cos(angle) * labelDistance;
      const y = centerY + Math.sin(angle) * labelDistance;

      ctx.fillText(category, x, y);
    });

  }, [risks]);

  return (
    <div className="risk-assessment-radar">
      <h4>Risk Assessment</h4>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}

function PredictionAccuracyGauge({ accuracy, target = 0.9 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gauge background
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // Draw accuracy arc
    const accuracyAngle = Math.PI * accuracy;
    const color = accuracy >= target ? '#10b981' : accuracy >= 0.8 ? '#f59e0b' : '#ef4444';

    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + accuracyAngle);
    ctx.stroke();

    // Draw target indicator
    if (target) {
      const targetAngle = Math.PI + Math.PI * target;
      const x1 = centerX + Math.cos(targetAngle) * (radius - 15);
      const y1 = centerY + Math.sin(targetAngle) * (radius - 15);
      const x2 = centerX + Math.cos(targetAngle) * (radius + 15);
      const y2 = centerY + Math.sin(targetAngle) * (radius + 15);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw center text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(accuracy * 100)}%`, centerX, centerY - 10);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Accuracy', centerX, centerY + 20);

  }, [accuracy, target]);

  return (
    <div className="prediction-accuracy-gauge">
      <canvas
        ref={canvasRef}
        width={200}
        height={120}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}

// Main Market Metrics Visualizer Component
export default function MarketMetricsVisualizer({
  marketData,
  predictions,
  intelligence,
  realTimeMetrics,
  className = ''
}) {
  const [activeView, setActiveView] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate sample real-time data
  const [realtimeData, setRealtimeData] = useState([]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newDataPoint = {
        timestamp: new Date(),
        value: 0.7 + Math.random() * 0.3,
        marketSentiment: Math.random(),
        volatility: Math.random() * 0.4
      };
      setRealtimeData(prev => [...prev.slice(-49), newDataPoint]);
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const currentMetrics = useMemo(() => {
    return {
      marketTrend: marketData?.trend || 'neutral',
      confidence: marketData?.confidence || 0.75,
      volatility: marketData?.volatility || 0.25,
      sentiment: marketData?.sentiment || 0.6,
      change: (Math.random() - 0.5) * 10 // -5% to +5%
    };
  }, [marketData]);

  const competitiveData = useMemo(() => {
    return {
      competitors: [
        { name: 'Our Company', marketShare: 15.5, isUs: true },
        { name: 'Market Leader', marketShare: 28.3, isUs: false },
        { name: 'Competitor A', marketShare: 18.7, isUs: false },
        { name: 'Competitor B', marketShare: 12.1, isUs: false },
        { name: 'Others', marketShare: 25.4, isUs: false }
      ]
    };
  }, []);

  const opportunityData = useMemo(() => {
    return [
      { name: 'AI Integration', impact: 85, probability: 0.8, timeline: '6 months' },
      { name: 'Cloud Migration', impact: 70, probability: 0.9, timeline: '3 months' },
      { name: 'Mobile App', impact: 60, probability: 0.7, timeline: '9 months' },
      { name: 'Data Analytics', impact: 75, probability: 0.85, timeline: '4 months' },
      { name: 'API Platform', impact: 55, probability: 0.6, timeline: '12 months' },
      { name: 'IoT Integration', impact: 65, probability: 0.5, timeline: '18 months' }
    ];
  }, []);

  const riskData = useMemo(() => {
    return {
      'Technical': 35,
      'Market': 45,
      'Financial': 25,
      'Operational': 40,
      'Regulatory': 20,
      'Competitive': 55
    };
  }, []);

  return (
    <div className={`market-metrics-visualizer ${className}`}>
      <div className="visualizer-header">
        <h3><BarChart3 size={20} /> Market Intelligence Dashboard</h3>
        <div className="visualizer-controls">
          <div className="view-selector">
            <button
              className={`view-button ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <Target size={16} /> Overview
            </button>
            <button
              className={`view-button ${activeView === 'competitive' ? 'active' : ''}`}
              onClick={() => setActiveView('competitive')}
            >
              <BarChart3 size={16} /> Competitive
            </button>
            <button
              className={`view-button ${activeView === 'opportunities' ? 'active' : ''}`}
              onClick={() => setActiveView('opportunities')}
            >
              <Zap size={16} /> Opportunities
            </button>
            <button
              className={`view-button ${activeView === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveView('risks')}
            >
              <AlertTriangle size={16} /> Risks
            </button>
          </div>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Real-time</span>
          </label>
        </div>
      </div>

      <div className="visualizer-content">
        {activeView === 'overview' && (
          <div className="overview-grid">
            <div className="viz-card">
              <h4>Market Trend</h4>
              <MarketTrendIndicator
                trend={currentMetrics.marketTrend}
                confidence={currentMetrics.confidence}
                change={currentMetrics.change}
              />
            </div>

            <div className="viz-card">
              <h4>Real-Time Metrics</h4>
              <RealTimeMetricsChart
                data={realtimeData[realtimeData.length - 1]}
                height={200}
              />
            </div>

            <div className="viz-card">
              <h4>Prediction Accuracy</h4>
              <PredictionAccuracyGauge
                accuracy={predictions?.accuracy || 0.92}
                target={0.9}
              />
            </div>

            <div className="viz-card full-width">
              <CompetitivePositioningChart data={competitiveData} />
            </div>
          </div>
        )}

        {activeView === 'competitive' && (
          <div className="competitive-grid">
            <div className="viz-card">
              <CompetitivePositioningChart data={competitiveData} />
            </div>
            <div className="viz-card">
              <h4>Market Dynamics</h4>
              <div className="market-dynamics">
                <div className="dynamic-metric">
                  <span className="metric-label">Market Growth</span>
                  <span className="metric-value positive">+18.5%</span>
                </div>
                <div className="dynamic-metric">
                  <span className="metric-label">Competition Intensity</span>
                  <span className="metric-value high">High</span>
                </div>
                <div className="dynamic-metric">
                  <span className="metric-label">Innovation Rate</span>
                  <span className="metric-value medium">Medium</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'opportunities' && (
          <div className="opportunities-grid">
            <div className="viz-card full-width">
              <OpportunityHeatmap opportunities={opportunityData} />
            </div>
          </div>
        )}

        {activeView === 'risks' && (
          <div className="risks-grid">
            <div className="viz-card">
              <RiskAssessmentRadar risks={riskData} />
            </div>
            <div className="viz-card">
              <h4>Risk Mitigation</h4>
              <div className="risk-mitigation">
                {Object.entries(riskData).map(([category, level]) => (
                  <div key={category} className="risk-item">
                    <span className="risk-category">{category}</span>
                    <div className="risk-level-bar">
                      <div
                        className={`risk-fill level-${Math.floor(level / 20)}`}
                        style={{ width: `${level}%` }}
                      />
                    </div>
                    <span className="risk-percentage">{level}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {realTimeMetrics && (
        <div className="realtime-status">
          <div className="status-indicator">
            <div className="status-dot active" />
            <span>Live: {realTimeMetrics.latency}ms latency</span>
          </div>
          <div className="throughput-indicator">
            <span>{realTimeMetrics.throughput} updates/min</span>
          </div>
        </div>
      )}
    </div>
  );
}