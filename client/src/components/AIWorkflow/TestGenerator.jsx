/**
 * Test Generator Component
 * Frontend interface for AI-powered test generation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Copy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BugReport as BugReportIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const TestGenerator = () => {
  const [testType, setTestType] = useState('unit');
  const [requirements, setRequirements] = useState('');
  const [coverage, setCoverage] = useState(90);
  const [framework, setFramework] = useState('jest');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [testTypes, setTestTypes] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [enableEdgeCases, setEnableEdgeCases] = useState(true);
  const [enableMutationTesting, setEnableMutationTesting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [generationHistory, setGenerationHistory] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  const webSocketRef = useRef(null);

  // Available test types
  const availableTestTypes = [
    { value: 'unit', label: 'Unit Tests', icon: '🔧', description: 'Test individual components and functions' },
    { value: 'integration', label: 'Integration Tests', icon: '🔗', description: 'Test component interactions' },
    { value: 'e2e', label: 'End-to-End Tests', icon: '🌐', description: 'Test complete user workflows' },
    { value: 'performance', label: 'Performance Tests', icon: '⚡', description: 'Test system performance under load' },
    { value: 'security', label: 'Security Tests', icon: '🔒', description: 'Test security vulnerabilities' }
  ];

  // Available frameworks
  const frameworks = [
    { value: 'jest', label: 'Jest', language: 'JavaScript', type: 'unit' },
    { value: 'mocha', label: 'Mocha', language: 'JavaScript', type: 'unit' },
    { value: 'jasmine', label: 'Jasmine', language: 'JavaScript', type: 'unit' },
    { value: 'junit', label: 'JUnit', language: 'Java', type: 'unit' },
    { value: 'pytest', label: 'PyTest', language: 'Python', type: 'unit' },
    { value: 'cypress', label: 'Cypress', language: 'JavaScript', type: 'e2e' },
    { value: 'selenium', label: 'Selenium', language: 'Multiple', type: 'e2e' },
    { value: 'playwright', label: 'Playwright', language: 'JavaScript', type: 'e2e' }
  ];

  useEffect(() => {
    loadTestTypes();
    loadMetrics();
    setupWebSocket();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    try {
      webSocketRef.current = new WebSocket('ws://localhost:3001/ws/test-generator');

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'generation-progress':
            setProgress(data.progress);
            break;
          case 'generation-completed':
            setGeneratedTests(data.result);
            setIsGenerating(false);
            setProgress(100);
            showSnackbar('Tests generated successfully!');
            addToHistory(data.result);
            break;
          case 'generation-failed':
            setError(data.error);
            setIsGenerating(false);
            setProgress(0);
            break;
        }
      };
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to HTTP polling');
    }
  };

  const loadTestTypes = async () => {
    try {
      const response = await fetch('/api/ai-services/test-generator/types');
      const data = await response.json();
      setTestTypes(data.types || availableTestTypes);
    } catch (error) {
      console.error('Failed to load test types:', error);
      setTestTypes(availableTestTypes);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/ai-services/test-generator/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      setError('Please provide requirements to generate tests');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/ai-services/test-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: testType,
          requirements,
          coverage,
          context: {
            framework,
            enableEdgeCases,
            enableMutationTesting,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
        setGeneratedTests(result);
        setIsGenerating(false);
        setProgress(100);
        showSnackbar('Tests generated successfully!');
        addToHistory(result);
      }

    } catch (error) {
      setError(error.message);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!generatedTests) return;

    const content = generatedTests.tests.map(test => test.code).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-tests-${testType}.js`;
    a.click();
    URL.revokeObjectURL(url);

    showSnackbar('Tests downloaded successfully!');
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    showSnackbar('Code copied to clipboard!');
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const addToHistory = (result) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: testType,
      framework,
      coverage: result.coverage,
      testCount: result.tests.length,
      edgeCases: result.edgeCases.length,
      metadata: result.metadata
    };

    setGenerationHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
  };

  const getTestTypeIcon = (type) => {
    const testTypeConfig = availableTestTypes.find(t => t.value === type);
    return testTypeConfig ? testTypeConfig.icon : '🧪';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.totalGenerations}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Total Generated
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.averageTestCount?.toFixed(0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avg Tests per Run
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.averageCoverage?.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avg Coverage
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.edgeCasesGenerated}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Edge Cases Generated
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderConfigurationPanel = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Test Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Test Type</InputLabel>
              <Select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                label="Test Type"
              >
                {availableTestTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{type.icon}</span>
                      <Box>
                        <Typography variant="body2">{type.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Framework</InputLabel>
              <Select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                label="Framework"
              >
                {frameworks
                  .filter(f => f.type === testType || f.type === 'unit')
                  .map((fw) => (
                    <MenuItem key={fw.value} value={fw.value}>
                      <Box>
                        <Typography variant="body2">{fw.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {fw.language}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Target Coverage: {coverage}%
            </Typography>
            <Slider
              value={coverage}
              onChange={(e, value) => setCoverage(value)}
              min={50}
              max={100}
              step={5}
              marks={[
                { value: 50, label: '50%' },
                { value: 70, label: '70%' },
                { value: 90, label: '90%' },
                { value: 100, label: '100%' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={enableEdgeCases}
                  onChange={(e) => setEnableEdgeCases(e.target.checked)}
                />
              }
              label="Generate Edge Cases"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={enableMutationTesting}
                  onChange={(e) => setEnableMutationTesting(e.target.checked)}
                />
              }
              label="Enable Mutation Testing"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRequirementsInput = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon sx={{ mr: 1 }} />
          Requirements Input
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Enter your requirements, specifications, or code that needs testing..."
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating || !requirements.trim()}
            startIcon={<BugReportIcon />}
            sx={{ minWidth: 120 }}
          >
            {isGenerating ? 'Generating...' : 'Generate Tests'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => setRequirements('')}
            disabled={isGenerating}
            startIcon={<RefreshIcon />}
          >
            Clear
          </Button>

          <Button
            variant="outlined"
            onClick={() => setSettingsOpen(true)}
            startIcon={<SettingsIcon />}
          >
            Advanced Settings
          </Button>
        </Box>

        {isGenerating && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Generating tests... {progress}%
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderTestResults = () => {
    if (!generatedTests) return null;

    const handleTabChange = (event, newValue) => {
      setCurrentTab(newValue);
    };

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <CodeIcon sx={{ mr: 1 }} />
              Generated Tests
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Download">
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Preview">
                <IconButton onClick={() => setPreviewOpen(true)}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Coverage and Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {generatedTests.tests.length}
                </Typography>
                <Typography variant="caption">Test Cases</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {generatedTests.coverage.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption">Coverage</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {generatedTests.edgeCases.length}
                </Typography>
                <Typography variant="caption">Edge Cases</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {Math.round(generatedTests.metadata.generationTime / 1000)}s
                </Typography>
                <Typography variant="caption">Generation Time</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabs for different views */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label="Test Code" />
              <Tab label="Test Scenarios" />
              <Tab label="Edge Cases" />
              <Tab label="Coverage Analysis" />
            </Tabs>
          </Box>

          {/* Tab content */}
          {currentTab === 0 && renderTestCode()}
          {currentTab === 1 && renderTestScenarios()}
          {currentTab === 2 && renderEdgeCases()}
          {currentTab === 3 && renderCoverageAnalysis()}
        </CardContent>
      </Card>
    );
  };

  const renderTestCode = () => (
    <Box>
      {generatedTests.tests.map((test, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1">{test.component}</Typography>
              <Chip size="small" label={test.framework} />
              <Chip size="small" label={`${test.scenarios} scenarios`} />
              <Box sx={{ ml: 'auto' }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(test.code);
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: 400
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {test.code}
              </pre>
            </Paper>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderTestScenarios = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Component</TableCell>
            <TableCell>Scenario</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Duration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {generatedTests.scenarios.map((scenario, index) => (
            <TableRow key={index}>
              <TableCell>{scenario.component}</TableCell>
              <TableCell>{scenario.name}</TableCell>
              <TableCell>
                <Chip size="small" label={scenario.category} variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={scenario.priority}
                  color={getPriorityColor(scenario.priority)}
                />
              </TableCell>
              <TableCell>{scenario.estimatedDuration}s</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderEdgeCases = () => (
    <Box>
      {generatedTests.edgeCases.map((edgeCase, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">{edgeCase.scenario}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip size="small" label={edgeCase.category} variant="outlined" />
                <Chip
                  size="small"
                  label={edgeCase.complexity}
                  color={edgeCase.complexity === 'high' ? 'error' : edgeCase.complexity === 'medium' ? 'warning' : 'success'}
                />
              </Box>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {edgeCase.description}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Component: {edgeCase.component}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderCoverageAnalysis = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Coverage Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Overall Coverage: {generatedTests.coverage.percentage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={generatedTests.coverage.percentage}
                sx={{ mt: 1 }}
              />
            </Box>
            <Typography variant="body2">
              Components Tested: {generatedTests.coverage.testedComponents} / {generatedTests.coverage.totalComponents}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            {Object.entries(generatedTests.coverage.categoryDistribution).map(([category, count]) => (
              <Box key={category} sx={{ mb: 1 }}>
                <Typography variant="body2">{category}: {count}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            {generatedTests.recommendations.map((rec, index) => (
              <Alert
                key={index}
                severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">{rec.message}</Typography>
              </Alert>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderHistory = () => {
    if (generationHistory.length === 0) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Generation History ({generationHistory.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Framework</TableCell>
                  <TableCell>Tests</TableCell>
                  <TableCell>Coverage</TableCell>
                  <TableCell>Edge Cases</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generationHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{getTestTypeIcon(item.type)}</span>
                        {item.type}
                      </Box>
                    </TableCell>
                    <TableCell>{item.framework}</TableCell>
                    <TableCell>{item.testCount}</TableCell>
                    <TableCell>{item.coverage.percentage.toFixed(1)}%</TableCell>
                    <TableCell>{item.edgeCases}</TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BugReportIcon sx={{ mr: 2, fontSize: 'inherit' }} />
        AI Test Generator
      </Typography>

      <Typography variant="body1" color="textSecondary" paragraph>
        Generate comprehensive test suites with intelligent edge case detection and automated coverage analysis.
      </Typography>

      {renderMetrics()}
      {renderConfigurationPanel()}
      {renderRequirementsInput()}
      {renderTestResults()}
      {renderHistory()}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Test Code Preview</DialogTitle>
        <DialogContent>
          {generatedTests && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={0}>
                <Tab label="Generated Tests" />
              </Tabs>
              <Box sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
                {renderTestCode()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button onClick={handleDownload} variant="contained">
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Advanced Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={enableEdgeCases}
                  onChange={(e) => setEnableEdgeCases(e.target.checked)}
                />
              }
              label="Generate Edge Cases"
            />
            <Typography variant="caption" display="block" color="textSecondary">
              Automatically identify and generate edge case scenarios
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={enableMutationTesting}
                  onChange={(e) => setEnableMutationTesting(e.target.checked)}
                />
              }
              label="Enable Mutation Testing"
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" display="block" color="textSecondary">
              Generate mutation tests to verify test effectiveness
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={() => setSettingsOpen(false)} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default TestGenerator;