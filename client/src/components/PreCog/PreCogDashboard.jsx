/**
 * PreCog Dashboard - Main Predictive Analytics Interface
 * Minority Report-inspired market intelligence command center
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Alert,
  Tooltip,
  CircularProgress,
  Fade,
  Slide,
  Badge,
  Avatar,
  Divider
} from '@mui/material';
import {
  Visibility,
  Psychology,
  Timeline,
  Security,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Lightbulb,
  Speed,
  Assessment,
  Map,
  Search,
  PriceCheck,
  Analytics,
  Refresh,
  Settings,
  Fullscreen,
  NotificationsActive
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import VisionChamber from './VisionChamber';

const PreCogDashboard = ({ marketData, onPredictionUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState('operational');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [realTimeData, setRealTimeData] = useState({});
  const [selectedTimeframe, setSelectedTimeframe] = useState('3M');
  const dashboardRef = useRef(null);
  const updateInterval = useRef(null);

  const precogTheme = {
    primary: '#00d4ff',
    secondary: '#0099cc',
    accent: '#ff6b35',
    warning: '#ffd23f',
    success: '#4caf50',
    error: '#f44336',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ffffff'
  };

  const precogSystems = [
    { name: 'PreVision', status: 'active', accuracy: 0.87, icon: <Timeline />, description: 'Trend Prediction Engine' },
    { name: 'Oracle', status: 'active', accuracy: 0.92, icon: <Search />, description: 'Competitive Intelligence' },
    { name: 'PreCrime', status: 'active', accuracy: 0.89, icon: <Security />, description: 'Risk Detection System' },
    { name: 'FutureSight', status: 'active', accuracy: 0.86, icon: <Visibility />, description: 'Success Probability' },
    { name: 'MinorityReport', status: 'scanning', accuracy: 0.79, icon: <Psychology />, description: 'Contrarian Opportunities' }
  ];

  const timeframes = ['1M', '3M', '6M', '1Y'];

  useEffect(() => {
    initializePreCogSystems();
    startRealTimeUpdates();

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  const initializePreCogSystems = async () => {
    setSystemStatus('initializing');

    // Simulate system initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate initial predictions
    const initialPredictions = await generatePredictions();
    setPredictions(initialPredictions);

    // Generate alerts
    const initialAlerts = generateAlerts();
    setAlerts(initialAlerts);

    setSystemStatus('operational');
  };

  const startRealTimeUpdates = () => {
    updateInterval.current = setInterval(async () => {
      await updateRealTimeData();
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds
  };

  const updateRealTimeData = async () => {
    // Simulate real-time market data updates
    const newData = {
      marketSentiment: 0.3 + Math.random() * 0.4, // 0.3 - 0.7
      competitiveActivity: Math.floor(Math.random() * 10) + 1,
      riskLevel: Math.random() * 0.8,
      opportunityScore: Math.random() * 1,
      predictionAccuracy: 0.8 + Math.random() * 0.15
    };

    setRealTimeData(newData);

    // Check for new alerts
    if (newData.riskLevel > 0.7) {
      const newAlert = {
        id: Date.now(),
        type: 'risk',
        severity: 'high',
        message: 'High risk level detected in market analysis',
        timestamp: new Date(),
        system: 'PreCrime'
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  };

  const generatePredictions = async () => {
    return {
      marketTrends: generateMarketTrendData(),
      competitiveAnalysis: generateCompetitiveData(),
      riskAssessment: generateRiskData(),
      opportunities: generateOpportunityData(),
      successProbability: generateSuccessData()
    };
  };

  const generateMarketTrendData = () => {
    const baseValue = 100;
    return Array.from({ length: 12 }, (_, i) => {
      const trend = baseValue + (i * 8) + (Math.random() * 20 - 10);
      const prediction = trend + (Math.random() * 30 - 15);
      const confidence = 0.7 + Math.random() * 0.25;

      return {
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        actual: Math.round(trend),
        predicted: Math.round(prediction),
        confidence: Math.round(confidence * 100),
        volume: Math.floor(Math.random() * 1000000) + 500000
      };
    });
  };

  const generateCompetitiveData = () => {
    return [
      { name: 'Market Leader', marketShare: 35, threatLevel: 85, position: [80, 90], growth: 12 },
      { name: 'Strong Competitor', marketShare: 22, threatLevel: 70, position: [70, 75], growth: 8 },
      { name: 'Emerging Player', marketShare: 15, threatLevel: 60, position: [50, 65], growth: 25 },
      { name: 'Our Position', marketShare: 18, threatLevel: 0, position: [65, 80], growth: 18 },
      { name: 'Niche Player', marketShare: 10, threatLevel: 30, position: [40, 50], growth: 5 }
    ];
  };

  const generateRiskData = () => {
    return [
      { category: 'Market Saturation', level: 65, trend: 'increasing', impact: 'high' },
      { category: 'Technology Disruption', level: 80, trend: 'stable', impact: 'very high' },
      { category: 'Economic Factors', level: 45, trend: 'decreasing', impact: 'medium' },
      { category: 'Regulatory Changes', level: 55, trend: 'increasing', impact: 'medium' },
      { category: 'Competitive Pressure', level: 70, trend: 'increasing', impact: 'high' }
    ];
  };

  const generateOpportunityData = () => {
    return [
      { opportunity: 'Emerging Market Entry', value: 85, effort: 60, timeline: 6, roi: 180 },
      { opportunity: 'Technology Partnership', value: 70, effort: 30, timeline: 3, roi: 120 },
      { opportunity: 'Product Innovation', value: 90, effort: 80, timeline: 12, roi: 250 },
      { opportunity: 'Market Consolidation', value: 65, effort: 70, timeline: 18, roi: 160 },
      { opportunity: 'Customer Segment Expansion', value: 75, effort: 45, timeline: 9, roi: 140 }
    ];
  };

  const generateSuccessData = () => {
    return {
      overall: 0.74,
      technical: 0.82,
      market: 0.68,
      execution: 0.71,
      factors: [
        { factor: 'Technical Capability', score: 82, weight: 30 },
        { factor: 'Market Position', score: 68, weight: 25 },
        { factor: 'Execution Risk', score: 71, weight: 20 },
        { factor: 'Financial Resources', score: 76, weight: 15 },
        { factor: 'Competitive Advantage', score: 79, weight: 10 }
      ]
    };
  };

  const generateAlerts = () => {
    return [
      {
        id: 1,
        type: 'opportunity',
        severity: 'high',
        message: 'New market opportunity detected in emerging technology sector',
        timestamp: new Date(Date.now() - 5 * 60000),
        system: 'Oracle'
      },
      {
        id: 2,
        type: 'risk',
        severity: 'medium',
        message: 'Competitive activity increase in core market segment',
        timestamp: new Date(Date.now() - 15 * 60000),
        system: 'PreCrime'
      },
      {
        id: 3,
        type: 'trend',
        severity: 'low',
        message: 'Market sentiment shift detected in customer behavior patterns',
        timestamp: new Date(Date.now() - 30 * 60000),
        system: 'PreVision'
      }
    ];
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRescan = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const newPredictions = await generatePredictions();
    setPredictions(newPredictions);
    setIsScanning(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return precogTheme.success;
      case 'scanning': return precogTheme.warning;
      case 'error': return precogTheme.error;
      default: return precogTheme.primary;
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'risk': return <Warning />;
      case 'opportunity': return <Lightbulb />;
      case 'trend': return <TrendingUp />;
      default: return <Info />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return precogTheme.error;
      case 'medium': return precogTheme.warning;
      case 'low': return precogTheme.primary;
      default: return precogTheme.text;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <Box
      ref={dashboardRef}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${precogTheme.background} 0%, #1a1a2e 50%, ${precogTheme.background} 100%)`,
        color: precogTheme.text,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dashboard Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(0, 212, 255, 0.1)',
          borderBottom: `2px solid ${precogTheme.primary}`,
          p: 3,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Analytics sx={{ fontSize: 40, color: precogTheme.primary }} />
              <Box>
                <Typography variant="h4" sx={{ color: precogTheme.primary, fontWeight: 'bold' }}>
                  PreCog Command Center
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Predictive Market Intelligence Dashboard
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs />
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label={`Status: ${systemStatus.toUpperCase()}`}
                color={systemStatus === 'operational' ? 'success' : 'warning'}
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={`Last Update: ${lastUpdate.toLocaleTimeString()}`}
                sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
              <IconButton
                onClick={handleRescan}
                disabled={isScanning}
                sx={{ color: precogTheme.primary }}
              >
                {isScanning ? <CircularProgress size={24} /> : <Refresh />}
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* System Status Bar */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          p: 2
        }}
      >
        <Grid container spacing={2}>
          {precogSystems.map((system, index) => (
            <Grid item key={system.name}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: getStatusColor(system.status) }}>
                  {system.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {system.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {(system.accuracy * 100).toFixed(0)}% accuracy
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Dashboard Content */}
      <Box sx={{ p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: precogTheme.primary }
          }}
        >
          <Tab label="Market Overview" icon={<Assessment />} />
          <Tab label="Competitive Analysis" icon={<Search />} />
          <Tab label="Risk Assessment" icon={<Security />} />
          <Tab label="Opportunities" icon={<Lightbulb />} />
          <Tab label="Vision Chamber" icon={<Visibility />} />
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                {/* Market Trend Prediction */}
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: precogTheme.primary }}>
                        Market Trend Predictions
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {timeframes.map((tf) => (
                          <Chip
                            key={tf}
                            label={tf}
                            size="small"
                            onClick={() => setSelectedTimeframe(tf)}
                            sx={{
                              backgroundColor: selectedTimeframe === tf ? precogTheme.primary : 'rgba(255,255,255,0.1)',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={predictions.marketTrends || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="month" tick={{ fill: 'white' }} />
                          <YAxis yAxisId="left" tick={{ fill: 'white' }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'white' }} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="actual"
                            fill={precogTheme.primary}
                            fillOpacity={0.6}
                            stroke={precogTheme.primary}
                            strokeWidth={2}
                            name="Actual"
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="predicted"
                            stroke={precogTheme.accent}
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            name="Predicted"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="confidence"
                            fill={precogTheme.warning}
                            fillOpacity={0.7}
                            name="Confidence %"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                {/* Real-time Metrics */}
                <Grid item xs={12} lg={4}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: precogTheme.primary, fontWeight: 'bold' }}>
                          {predictions.successProbability ? (predictions.successProbability.overall * 100).toFixed(0) : '74'}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Success Probability
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={predictions.successProbability ? predictions.successProbability.overall * 100 : 74}
                          sx={{
                            mt: 1,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: precogTheme.primary
                            }
                          }}
                        />
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: precogTheme.secondary, fontWeight: 'bold' }}>
                          {realTimeData.competitiveActivity || 7}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Competitive Moves
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: precogTheme.accent, fontWeight: 'bold' }}>
                          {realTimeData.riskLevel ? (realTimeData.riskLevel * 100).toFixed(0) : '42'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Risk Level
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                          Recent Alerts
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {alerts.slice(0, 3).map((alert) => (
                            <Box key={alert.id} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{ color: getAlertColor(alert.severity) }}>
                                  {getAlertIcon(alert.type)}
                                </Box>
                                <Chip
                                  label={alert.system}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                                {alert.message}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                {formatTimeAgo(alert.timestamp)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="competitive"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Competitive Landscape Analysis
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart data={predictions.competitiveAnalysis || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            type="number"
                            dataKey="position[0]"
                            domain={[0, 100]}
                            name="Market Position"
                            tick={{ fill: 'white' }}
                          />
                          <YAxis
                            type="number"
                            dataKey="position[1]"
                            domain={[0, 100]}
                            name="Strategic Strength"
                            tick={{ fill: 'white' }}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                            cursor={{ strokeDasharray: '3 3' }}
                            formatter={(value, name, props) => [
                              `${props.payload.name}: ${value}%`,
                              name
                            ]}
                          />
                          <Scatter
                            name="Competitors"
                            dataKey="marketShare"
                            fill={precogTheme.primary}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Competitive Intelligence
                    </Typography>
                    {(predictions.competitiveAnalysis || []).map((competitor, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {competitor.name}
                          </Typography>
                          <Chip
                            label={`${competitor.marketShare}%`}
                            size="small"
                            sx={{ backgroundColor: precogTheme.secondary, color: 'white' }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          Growth: {competitor.growth}% | Threat: {competitor.threatLevel}/100
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={competitor.threatLevel}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: competitor.threatLevel > 70 ? precogTheme.accent :
                                              competitor.threatLevel > 40 ? precogTheme.warning :
                                              precogTheme.success
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Risk Assessment Matrix
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={predictions.riskAssessment || []}>
                          <PolarGrid stroke={precogTheme.primary} />
                          <PolarAngleAxis dataKey="category" tick={{ fill: 'white', fontSize: 10 }} />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: 'white', fontSize: 8 }}
                          />
                          <Radar
                            name="Risk Level"
                            dataKey="level"
                            stroke={precogTheme.accent}
                            fill={precogTheme.accent}
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Risk Categories
                    </Typography>
                    {(predictions.riskAssessment || []).map((risk, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {risk.category}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={risk.impact}
                              size="small"
                              color={risk.impact === 'very high' ? 'error' : risk.impact === 'high' ? 'warning' : 'success'}
                            />
                            <Chip
                              label={risk.trend}
                              size="small"
                              sx={{
                                backgroundColor: risk.trend === 'increasing' ? precogTheme.accent :
                                               risk.trend === 'decreasing' ? precogTheme.success :
                                               precogTheme.warning,
                                color: 'white'
                              }}
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={risk.level}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: risk.level > 70 ? precogTheme.accent :
                                              risk.level > 40 ? precogTheme.warning :
                                              precogTheme.success
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Level: {risk.level}/100
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Opportunity Value vs Effort Analysis
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart data={predictions.opportunities || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            type="number"
                            dataKey="effort"
                            domain={[0, 100]}
                            name="Effort Required"
                            tick={{ fill: 'white' }}
                          />
                          <YAxis
                            type="number"
                            dataKey="value"
                            domain={[0, 100]}
                            name="Opportunity Value"
                            tick={{ fill: 'white' }}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                            cursor={{ strokeDasharray: '3 3' }}
                            formatter={(value, name, props) => [
                              `${props.payload.opportunity}: ${value}`,
                              name
                            ]}
                          />
                          <Scatter
                            name="Opportunities"
                            dataKey="roi"
                            fill={precogTheme.primary}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ color: precogTheme.primary, mb: 2 }}>
                      Opportunity Pipeline
                    </Typography>
                    {(predictions.opportunities || []).map((opportunity, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {opportunity.opportunity}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Value: {opportunity.value}/100
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            ROI: {opportunity.roi}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          Timeline: {opportunity.timeline} months
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={opportunity.value}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: opportunity.value > 80 ? precogTheme.success :
                                              opportunity.value > 60 ? precogTheme.primary :
                                              precogTheme.warning
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {activeTab === 4 && (
            <motion.div
              key="vision"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <VisionChamber
                marketData={marketData}
                onAnalysisComplete={(results) => {
                  if (onPredictionUpdate) {
                    onPredictionUpdate(results);
                  }
                }}
                analysisConfig={{ depth: 'comprehensive' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Ambient Background Effects */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: systemStatus === 'scanning'
            ? 'radial-gradient(circle at 30% 70%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)'
            : 'none',
          animation: systemStatus === 'scanning' ? 'precogPulse 3s infinite' : 'none',
          '@keyframes precogPulse': {
            '0%': { opacity: 0.2 },
            '50%': { opacity: 0.6 },
            '100%': { opacity: 0.2 }
          }
        }}
      />
    </Box>
  );
};

export default PreCogDashboard;