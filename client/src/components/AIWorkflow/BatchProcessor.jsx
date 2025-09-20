/**
 * Batch Processor Component
 * Frontend interface for AI-powered batch processing operations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
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
  Switch,
  FormControlLabel,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Queue as QueueIcon,
  BatchPrediction as BatchPredictionIcon,
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

const BatchProcessor = () => {
  const [operation, setOperation] = useState('document-validation');
  const [items, setItems] = useState([]);
  const [batchSize, setBatchSize] = useState(50);
  const [parallel, setParallel] = useState(true);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);
  const [successfulItems, setSuccessfulItems] = useState(0);
  const [failedItems, setFailedItems] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [processingResults, setProcessingResults] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [processingHistory, setProcessingHistory] = useState([]);
  const [realTimeStats, setRealTimeStats] = useState({
    throughput: 0,
    avgProcessingTime: 0,
    errorRate: 0,
    memoryUsage: 0
  });

  const webSocketRef = useRef(null);
  const fileInputRef = useRef(null);

  // Available operations
  const operations = [
    { value: 'document-validation', label: 'Document Validation', icon: '✅', description: 'Validate document structure and content' },
    { value: 'document-generation', label: 'Document Generation', icon: '📄', description: 'Generate documents from templates' },
    { value: 'test-generation', label: 'Test Generation', icon: '🧪', description: 'Generate test cases from requirements' },
    { value: 'content-analysis', label: 'Content Analysis', icon: '📊', description: 'Analyze content for insights' },
    { value: 'quality-check', label: 'Quality Check', icon: '🔍', description: 'Perform quality assessments' },
    { value: 'format-conversion', label: 'Format Conversion', icon: '🔄', description: 'Convert between formats' },
    { value: 'ai-enhancement', label: 'AI Enhancement', icon: '✨', description: 'Enhance content with AI' }
  ];

  useEffect(() => {
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
      webSocketRef.current = new WebSocket('ws://localhost:3001/ws/batch-processor');

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'batch-started':
            setIsProcessing(true);
            setTotalBatches(Math.ceil(data.totalItems / batchSize));
            break;
          case 'batch-progress':
            setProgress(data.percentage);
            setProcessedItems(data.processed);
            setSuccessfulItems(data.successful);
            setFailedItems(data.failed);
            setCurrentBatch(Math.ceil(data.processed / batchSize));
            break;
          case 'batch-completed':
            setProcessingResults(data);
            setIsProcessing(false);
            setProgress(100);
            showSnackbar('Batch processing completed successfully!');
            addToHistory(data);
            break;
          case 'batch-failed':
            setError(data.error);
            setIsProcessing(false);
            break;
          case 'real-time-stats':
            setRealTimeStats(data.stats);
            break;
        }
      };
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to HTTP polling');
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/automation/batch-processor/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let parsedItems;

        if (file.type === 'application/json') {
          parsedItems = JSON.parse(content);
        } else {
          // Parse CSV or other formats
          parsedItems = content.split('\n').map((line, index) => ({
            id: `item-${index}`,
            content: line.trim(),
            type: 'text'
          })).filter(item => item.content);
        }

        setItems(Array.isArray(parsedItems) ? parsedItems : [parsedItems]);
        showSnackbar(`Loaded ${parsedItems.length} items`);
      } catch (error) {
        setError('Failed to parse uploaded file');
      }
    };

    reader.readAsText(file);
  };

  const handleStartProcessing = async () => {
    if (items.length === 0) {
      setError('Please upload items to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProcessedItems(0);
    setSuccessfulItems(0);
    setFailedItems(0);

    try {
      const response = await fetch('/api/automation/batch-processor/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          items,
          config: {
            batchSize,
            parallel,
            maxConcurrency,
            priority: 'normal'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      // WebSocket will handle the rest
    } catch (error) {
      setError(error.message);
      setIsProcessing(false);
    }
  };

  const handlePauseProcessing = async () => {
    setIsPaused(!isPaused);
    // Implementation would depend on backend support
  };

  const handleStopProcessing = async () => {
    try {
      await fetch('/api/automation/batch-processor/stop', {
        method: 'POST'
      });
      setIsProcessing(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to stop processing:', error);
    }
  };

  const handleDownloadResults = () => {
    if (!processingResults) return;

    const data = {
      operation,
      timestamp: new Date().toISOString(),
      summary: {
        totalItems: processingResults.totalItems,
        successfulItems: processingResults.processedItems,
        failedItems: processingResults.failedItems,
        processingTime: processingResults.processingTime,
        throughput: processingResults.throughput
      },
      results: processingResults.results,
      errors: processingResults.errors
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showSnackbar('Results downloaded successfully!');
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const addToHistory = (result) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      operation,
      totalItems: result.totalItems,
      successfulItems: result.processedItems,
      failedItems: result.failedItems,
      processingTime: result.processingTime,
      throughput: result.throughput
    };

    setProcessingHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
  };

  const getOperationIcon = (op) => {
    const operation = operations.find(o => o.value === op);
    return operation ? operation.icon : '⚙️';
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.totalProcessed}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Total Processed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.successRate?.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Success Rate
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.throughput?.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Items/sec
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {Math.round(metrics.averageProcessingTime / 1000)}s
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avg Time
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderConfiguration = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Batch Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Operation Type</InputLabel>
              <Select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                label="Operation Type"
              >
                {operations.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{op.icon}</span>
                      <Box>
                        <Typography variant="body2">{op.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {op.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Batch Size: {batchSize}
            </Typography>
            <Slider
              value={batchSize}
              onChange={(e, value) => setBatchSize(value)}
              min={10}
              max={200}
              step={10}
              marks={[
                { value: 10, label: '10' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
                { value: 200, label: '200' }
              ]}
              disabled={isProcessing}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={parallel}
                  onChange={(e) => setParallel(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Parallel Processing"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Max Concurrency: {maxConcurrency}
            </Typography>
            <Slider
              value={maxConcurrency}
              onChange={(e, value) => setMaxConcurrency(value)}
              min={1}
              max={20}
              step={1}
              disabled={isProcessing || !parallel}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderItemsInput = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <QueueIcon sx={{ mr: 1 }} />
          Items to Process ({items.length})
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<UploadIcon />}
            disabled={isProcessing}
          >
            Upload Items
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.txt"
            style={{ display: 'none' }}
          />

          <Button
            variant="outlined"
            onClick={() => setItems([])}
            disabled={isProcessing || items.length === 0}
            startIcon={<RefreshIcon />}
          >
            Clear Items
          </Button>

          <Button
            variant="outlined"
            onClick={() => setSettingsOpen(true)}
            startIcon={<SettingsIcon />}
          >
            Advanced Settings
          </Button>
        </Box>

        {items.length > 0 && (
          <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Sample Items (showing first 5):
            </Typography>
            {items.slice(0, 5).map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="caption">
                  {item.id || `Item ${index + 1}`}: {typeof item === 'string' ? item : item.content || JSON.stringify(item).substring(0, 100)}
                </Typography>
              </Box>
            ))}
            {items.length > 5 && (
              <Typography variant="caption" color="textSecondary">
                ... and {items.length - 5} more items
              </Typography>
            )}
          </Paper>
        )}
      </CardContent>
    </Card>
  );

  const renderProcessingControls = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <BatchPredictionIcon sx={{ mr: 1 }} />
          Processing Control
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleStartProcessing}
            disabled={isProcessing || items.length === 0}
            startIcon={<PlayArrowIcon />}
          >
            Start Processing
          </Button>

          <Button
            variant="outlined"
            onClick={handlePauseProcessing}
            disabled={!isProcessing}
            startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleStopProcessing}
            disabled={!isProcessing}
            startIcon={<StopIcon />}
            color="error"
          >
            Stop
          </Button>
        </Box>

        {isProcessing && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Progress: {processedItems} / {items.length} items
              </Typography>
              <Typography variant="body2">
                Batch {currentBatch} / {totalBatches}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">Success: {successfulItems}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="body2">Failed: {failedItems}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {realTimeStats.throughput.toFixed(1)} items/s
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {realTimeStats.avgProcessingTime.toFixed(0)}ms avg
                  </Typography>
                </Box>
              </Grid>
            </Grid>
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

  const renderResults = () => {
    if (!processingResults) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              Processing Results
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setResultsOpen(true)}
                startIcon={<InfoIcon />}
              >
                View Details
              </Button>
              <Button
                variant="outlined"
                onClick={handleDownloadResults}
                startIcon={<DownloadIcon />}
              >
                Download
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {processingResults.totalItems}
                </Typography>
                <Typography variant="caption">Total Items</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {processingResults.successfulItems}
                </Typography>
                <Typography variant="caption">Successful</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {processingResults.failedItems}
                </Typography>
                <Typography variant="caption">Failed</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {processingResults.throughput?.toFixed(1)}
                </Typography>
                <Typography variant="caption">Items/sec</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="body2" color="textSecondary">
            Processing completed in {Math.round(processingResults.processingTime / 1000)} seconds
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderHistory = () => {
    if (processingHistory.length === 0) return null;

    return (
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Processing History ({processingHistory.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Operation</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Throughput</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{getOperationIcon(item.operation)}</span>
                        {item.operation}
                      </Box>
                    </TableCell>
                    <TableCell>{item.totalItems}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.successfulItems}
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.failedItems}
                        color="error"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.throughput?.toFixed(1)} items/s</TableCell>
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
        <BatchPredictionIcon sx={{ mr: 2, fontSize: 'inherit' }} />
        AI Batch Processor
      </Typography>

      <Typography variant="body1" color="textSecondary" paragraph>
        Process large volumes of documents and data with intelligent batch operations, progress tracking, and automated error handling.
      </Typography>

      {renderMetrics()}
      {renderConfiguration()}
      {renderItemsInput()}
      {renderProcessingControls()}
      {renderResults()}
      {renderHistory()}

      {/* Results Detail Dialog */}
      <Dialog
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Results</DialogTitle>
        <DialogContent>
          {processingResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Successful Results</Typography>
              <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {processingResults.results?.slice(0, 10).map((result, index) => (
                  <Typography key={index} variant="caption" display="block">
                    {JSON.stringify(result).substring(0, 100)}...
                  </Typography>
                ))}
              </Paper>

              {processingResults.errors?.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>Errors</Typography>
                  <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    {processingResults.errors.slice(0, 10).map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Item: {error.item} - {error.error}
                        </Typography>
                      </Alert>
                    ))}
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsOpen(false)}>Close</Button>
          <Button onClick={handleDownloadResults} variant="contained">
            Download Full Results
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
            <Typography variant="subtitle2" gutterBottom>
              Performance Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={parallel}
                  onChange={(e) => setParallel(e.target.checked)}
                />
              }
              label="Enable Parallel Processing"
            />
            <Typography variant="caption" display="block" color="textSecondary">
              Process multiple items simultaneously for better throughput
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Max Concurrency: {maxConcurrency}
              </Typography>
              <Slider
                value={maxConcurrency}
                onChange={(e, value) => setMaxConcurrency(value)}
                min={1}
                max={20}
                step={1}
                disabled={!parallel}
              />
            </Box>
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

export default BatchProcessor;