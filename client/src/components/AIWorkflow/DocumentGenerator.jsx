/**
 * Document Generator Component
 * Frontend interface for AI-powered document generation
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
  FormControlLabel
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
  AutoFixHigh as AutoFixHighIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const DocumentGenerator = () => {
  const [documentType, setDocumentType] = useState('requirements');
  const [template, setTemplate] = useState('default');
  const [content, setContent] = useState('');
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [generationSpeed, setGenerationSpeed] = useState('standard');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [generationHistory, setGenerationHistory] = useState([]);

  const webSocketRef = useRef(null);

  // Available document types
  const documentTypes = [
    { value: 'requirements', label: 'Requirements Document', icon: '📋' },
    { value: 'technical-spec', label: 'Technical Specification', icon: '⚙️' },
    { value: 'test-plan', label: 'Test Plan', icon: '🧪' },
    { value: 'user-manual', label: 'User Manual', icon: '📖' },
    { value: 'api-documentation', label: 'API Documentation', icon: '🔗' },
    { value: 'generic', label: 'Generic Document', icon: '📄' }
  ];

  // Output formats
  const outputFormats = [
    { value: 'markdown', label: 'Markdown', extension: '.md' },
    { value: 'html', label: 'HTML', extension: '.html' },
    { value: 'pdf', label: 'PDF', extension: '.pdf' },
    { value: 'docx', label: 'Word Document', extension: '.docx' },
    { value: 'json', label: 'JSON', extension: '.json' }
  ];

  // Generation speeds
  const generationSpeeds = [
    { value: 'fast', label: 'Fast', description: 'Quick generation with basic content' },
    { value: 'standard', label: 'Standard', description: 'Balanced speed and quality' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Detailed content with high quality' }
  ];

  useEffect(() => {
    loadTemplates();
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
      webSocketRef.current = new WebSocket('ws://localhost:3001/ws/document-generator');

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'generation-progress':
            setProgress(data.progress);
            break;
          case 'generation-completed':
            setGeneratedDocument(data.result);
            setIsGenerating(false);
            setProgress(100);
            showSnackbar('Document generated successfully!');
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

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai-services/document-generator/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/ai-services/document-generator/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please provide some content to generate the document');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/ai-services/document-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: documentType,
          template: template === 'default' ? documentType : template,
          content,
          outputFormat,
          context: {
            aiEnhancement,
            generationSpeed,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
        // Fallback for when WebSocket is not available
        setGeneratedDocument(result);
        setIsGenerating(false);
        setProgress(100);
        showSnackbar('Document generated successfully!');
        addToHistory(result);
      }

    } catch (error) {
      setError(error.message);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!generatedDocument) return;

    const formatConfig = outputFormats.find(f => f.value === outputFormat);
    const blob = new Blob([generatedDocument.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-document${formatConfig.extension}`;
    a.click();
    URL.revokeObjectURL(url);

    showSnackbar('Document downloaded successfully!');
  };

  const handleCopy = () => {
    if (!generatedDocument) return;

    navigator.clipboard.writeText(generatedDocument.content);
    showSnackbar('Content copied to clipboard!');
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const addToHistory = (result) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: documentType,
      template,
      outputFormat,
      metadata: result.metadata,
      preview: result.content.substring(0, 200) + '...'
    };

    setGenerationHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
  };

  const getDocumentTypeIcon = (type) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType ? docType.icon : '📄';
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
              {Math.round(metrics.averageGenerationTime / 1000)}s
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avg Time
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.averageQualityScore?.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Avg Quality
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
          Document Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{type.icon}</span>
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                label="Template"
              >
                <MenuItem value="default">Default Template</MenuItem>
                {templates.map((tmpl) => (
                  <MenuItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.sections} sections)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                label="Output Format"
              >
                {outputFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label} ({format.extension})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Generation Speed</InputLabel>
              <Select
                value={generationSpeed}
                onChange={(e) => setGenerationSpeed(e.target.value)}
                label="Generation Speed"
              >
                {generationSpeeds.map((speed) => (
                  <MenuItem key={speed.value} value={speed.value}>
                    <Box>
                      <Typography variant="body2">{speed.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {speed.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={aiEnhancement}
                  onChange={(e) => setAiEnhancement(e.target.checked)}
                />
              }
              label="Enable AI Enhancement"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderContentInput = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon sx={{ mr: 1 }} />
          Content Input
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your content requirements, specifications, or base content here..."
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating || !content.trim()}
            startIcon={<AutoFixHighIcon />}
            sx={{ minWidth: 120 }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => setContent('')}
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
              Generating document... {progress}%
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

  const renderResults = () => {
    if (!generatedDocument) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon sx={{ mr: 1 }} />
              Generated Document
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Preview">
                <IconButton onClick={() => setPreviewOpen(true)}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy">
                <IconButton onClick={handleCopy}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {generatedDocument.metadata && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Chip
                    icon={<SpeedIcon />}
                    label={`${Math.round(generatedDocument.metadata.generationTime / 1000)}s`}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    icon={<AssessmentIcon />}
                    label={`Quality: ${(generatedDocument.metadata.qualityScore * 100).toFixed(0)}%`}
                    size="small"
                    variant="outlined"
                    color={generatedDocument.metadata.qualityScore > 0.8 ? 'success' : 'warning'}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    label={`${generatedDocument.metadata.contentLength} chars`}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    label={generatedDocument.metadata.outputFormat.toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Paper
            sx={{
              p: 2,
              maxHeight: 400,
              overflow: 'auto',
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {generatedDocument.content}
            </pre>
          </Paper>
        </CardContent>
      </Card>
    );
  };

  const renderHistory = () => {
    if (generationHistory.length === 0) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Generation History ({generationHistory.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {generationHistory.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemIcon>
                  <span style={{ fontSize: '1.2rem' }}>
                    {getDocumentTypeIcon(item.type)}
                  </span>
                </ListItemIcon>
                <ListItemText
                  primary={`${item.type} - ${item.template}`}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.preview}
                      </Typography>
                    </Box>
                  }
                />
                <Chip size="small" label={item.outputFormat} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AutoFixHighIcon sx={{ mr: 2, fontSize: 'inherit' }} />
        AI Document Generator
      </Typography>

      <Typography variant="body1" color="textSecondary" paragraph>
        Generate comprehensive documents using AI-powered content creation with intelligent templates and context awareness.
      </Typography>

      {renderMetrics()}
      {renderConfigurationPanel()}
      {renderContentInput()}
      {renderResults()}
      {renderHistory()}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {generatedDocument && (
            <Box sx={{ mt: 2 }}>
              <iframe
                srcDoc={generatedDocument.content}
                style={{ width: '100%', height: '500px', border: '1px solid #ddd' }}
                title="Document Preview"
              />
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
            <Typography variant="subtitle2" gutterBottom>
              Generation Quality
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={aiEnhancement}
                  onChange={(e) => setAiEnhancement(e.target.checked)}
                />
              }
              label="Enable AI Enhancement"
            />
            <Typography variant="caption" display="block" color="textSecondary">
              Uses advanced AI to improve content quality and suggestions
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

export default DocumentGenerator;