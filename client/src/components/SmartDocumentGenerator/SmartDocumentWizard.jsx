/**
 * Smart Document Generation Wizard
 * Advanced multi-step wizard for intelligent document generation with context-awareness
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Transform as TransformIcon,
  SmartToy as SmartToyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Insights as InsightsIcon,
  DataObject as DataObjectIcon,
  Code as CodeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const SmartDocumentWizard = () => {
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    input: '',
    documentType: '',
    context: {},
    options: {},
    templates: [],
    formats: ['markdown'],
    customization: {}
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedResults, setGeneratedResults] = useState(null);
  const [error, setError] = useState(null);

  // UI state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Data state
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const webSocketRef = useRef(null);

  const steps = [
    {
      label: 'Input & Analysis',
      description: 'Provide your content and let AI analyze it',
      icon: <PsychologyIcon />,
      component: 'InputAnalysis'
    },
    {
      label: 'Document Type & Context',
      description: 'Select document type and configure context',
      icon: <ArticleIcon />,
      component: 'TypeSelection'
    },
    {
      label: 'Templates & Customization',
      description: 'Choose templates and customize structure',
      icon: <SettingsIcon />,
      component: 'TemplateCustomization'
    },
    {
      label: 'Generation Options',
      description: 'Configure AI settings and output formats',
      icon: <AutoAwesomeIcon />,
      component: 'GenerationOptions'
    },
    {
      label: 'Generate & Review',
      description: 'Generate document and review results',
      icon: <DescriptionIcon />,
      component: 'GenerateReview'
    }
  ];

  useEffect(() => {
    loadInitialData();
    setupWebSocket();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [typesRes, templatesRes, formatsRes, metricsRes] = await Promise.all([
        fetch('/api/smart-document-generator/types'),
        fetch('/api/smart-document-generator/templates'),
        fetch('/api/smart-document-generator/formats'),
        fetch('/api/smart-document-generator/metrics')
      ]);

      const types = await typesRes.json();
      const templates = await templatesRes.json();
      const formats = await formatsRes.json();
      const metrics = await metricsRes.json();

      setAvailableTypes(types.types || []);
      setAvailableTemplates(templates.templates || []);
      setAvailableFormats(formats.formats || []);
      setMetrics(metrics);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const setupWebSocket = () => {
    try {
      webSocketRef.current = new WebSocket('ws://localhost:3001/ws/smart-document-generator');

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'analysis-progress':
            setGenerationProgress(data.progress);
            setGenerationStatus(data.status);
            break;
          case 'generation-progress':
            setGenerationProgress(data.progress);
            setGenerationStatus(data.status);
            break;
          case 'generation-completed':
            setGeneratedResults(data.result);
            setIsGenerating(false);
            setGenerationProgress(100);
            setGenerationStatus('Completed');
            break;
          case 'generation-failed':
            setError(data.error);
            setIsGenerating(false);
            setGenerationProgress(0);
            setGenerationStatus('Failed');
            break;
          case 'suggestions-updated':
            setSuggestions(data.suggestions);
            break;
        }
      };
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  };

  const updateWizardData = useCallback((field, value) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleNext = async () => {
    // Validate current step
    const validation = await validateStep(activeStep);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Perform step-specific actions
    await performStepAction(activeStep);

    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = async (stepIndex) => {
    switch (stepIndex) {
      case 0: // Input Analysis
        if (!wizardData.input.trim()) {
          return { valid: false, error: 'Please provide input content' };
        }
        if (wizardData.input.trim().length < 10) {
          return { valid: false, error: 'Input content is too short (minimum 10 characters)' };
        }
        return { valid: true };

      case 1: // Document Type
        if (!wizardData.documentType) {
          return { valid: false, error: 'Please select a document type' };
        }
        return { valid: true };

      case 2: // Templates
        // Templates are optional, but if selected should be valid
        return { valid: true };

      case 3: // Generation Options
        if (wizardData.formats.length === 0) {
          return { valid: false, error: 'Please select at least one output format' };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  };

  const performStepAction = async (stepIndex) => {
    switch (stepIndex) {
      case 0: // Analyze input
        await analyzeInput();
        break;
      case 1: // Suggest templates based on type
        await suggestTemplates();
        break;
      case 2: // Preview template structure
        await previewTemplateStructure();
        break;
      case 3: // Validate generation settings
        await validateGenerationSettings();
        break;
    }
  };

  const analyzeInput = async () => {
    try {
      setGenerationStatus('Analyzing input...');
      const response = await fetch('/api/smart-document-generator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: wizardData.input })
      });

      const result = await response.json();

      if (result.success) {
        updateWizardData('context', result.context);
        setSuggestions(result.suggestions || []);

        // Auto-suggest document type if confidence is high
        if (result.suggestedType && result.confidence > 0.8) {
          updateWizardData('documentType', result.suggestedType);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const suggestTemplates = async () => {
    if (!wizardData.documentType) return;

    try {
      const response = await fetch('/api/smart-document-generator/suggest-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: wizardData.documentType,
          context: wizardData.context
        })
      });

      const result = await response.json();
      if (result.success) {
        updateWizardData('templates', result.suggestions);
      }
    } catch (error) {
      console.error('Template suggestion failed:', error);
    }
  };

  const previewTemplateStructure = async () => {
    // This would generate a preview of the template structure
  };

  const validateGenerationSettings = async () => {
    // Validate that all settings are compatible
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationStatus('Starting generation...');

    try {
      const response = await fetch('/api/smart-document-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData)
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
        // Fallback without WebSocket
        setGeneratedResults(result);
        setIsGenerating(false);
        setGenerationProgress(100);
        setGenerationStatus('Completed');
      }
    } catch (error) {
      setError(error.message);
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('Failed');
    }
  };

  const renderStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return renderInputAnalysis();
      case 1:
        return renderTypeSelection();
      case 2:
        return renderTemplateCustomization();
      case 3:
        return renderGenerationOptions();
      case 4:
        return renderGenerateReview();
      default:
        return null;
    }
  };

  const renderInputAnalysis = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <PsychologyIcon sx={{ mr: 1 }} />
        Input Analysis
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Provide your content requirements, specifications, or base content. Our AI will analyze it to understand context and suggest the best document type and structure.
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={8}
        value={wizardData.input}
        onChange={(e) => updateWizardData('input', e.target.value)}
        placeholder="Example: 'Create a requirements document for a user authentication system with OAuth2 integration, password policies, and multi-factor authentication support...'"
        sx={{ mb: 3 }}
      />

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <LightbulbIcon sx={{ mr: 1, color: 'orange' }} />
              AI Suggestions
            </Typography>
            <Grid container spacing={1}>
              {suggestions.map((suggestion, index) => (
                <Grid item key={index}>
                  <Chip
                    size="small"
                    label={suggestion.text}
                    color={suggestion.confidence > 0.8 ? 'primary' : 'default'}
                    variant={suggestion.confidence > 0.8 ? 'filled' : 'outlined'}
                    onClick={() => updateWizardData('input', wizardData.input + ' ' + suggestion.text)}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Context Analysis Results */}
      {wizardData.context && Object.keys(wizardData.context).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InsightsIcon sx={{ mr: 1 }} />
              Analysis Results
            </Typography>
            <Grid container spacing={2}>
              {wizardData.context.complexity && (
                <Grid item xs={6} sm={3}>
                  <Chip
                    label={`Complexity: ${wizardData.context.complexity}`}
                    color={wizardData.context.complexity === 'high' ? 'error' :
                           wizardData.context.complexity === 'medium' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Grid>
              )}
              {wizardData.context.domain && (
                <Grid item xs={6} sm={3}>
                  <Chip
                    label={`Domain: ${wizardData.context.domain}`}
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
              )}
              {wizardData.context.scope && (
                <Grid item xs={6} sm={3}>
                  <Chip
                    label={`Scope: ${wizardData.context.scope}`}
                    color="secondary"
                    variant="outlined"
                  />
                </Grid>
              )}
              {wizardData.context.urgency && (
                <Grid item xs={6} sm={3}>
                  <Chip
                    label={`Urgency: ${wizardData.context.urgency}`}
                    color={wizardData.context.urgency === 'high' ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderTypeSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ArticleIcon sx={{ mr: 1 }} />
        Document Type & Context
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Select the type of document you want to generate. The AI has analyzed your input and may suggest the most appropriate type.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={wizardData.documentType}
              onChange={(e) => updateWizardData('documentType', e.target.value)}
              label="Document Type"
            >
              {availableTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span style={{ marginRight: 12, fontSize: '1.2rem' }}>{type.icon}</span>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">{type.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {type.description}
                      </Typography>
                    </Box>
                    <Badge badgeContent={type.sections} color="primary" sx={{ ml: 2 }} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Context Configuration */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Context Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select
                      value={wizardData.context.audience || ''}
                      onChange={(e) => updateWizardData('context', {
                        ...wizardData.context,
                        audience: e.target.value
                      })}
                      label="Target Audience"
                    >
                      <MenuItem value="technical">Technical Team</MenuItem>
                      <MenuItem value="business">Business Stakeholders</MenuItem>
                      <MenuItem value="executive">Executive Leadership</MenuItem>
                      <MenuItem value="general">General Audience</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Project Phase</InputLabel>
                    <Select
                      value={wizardData.context.phase || ''}
                      onChange={(e) => updateWizardData('context', {
                        ...wizardData.context,
                        phase: e.target.value
                      })}
                      label="Project Phase"
                    >
                      <MenuItem value="planning">Planning</MenuItem>
                      <MenuItem value="design">Design</MenuItem>
                      <MenuItem value="development">Development</MenuItem>
                      <MenuItem value="testing">Testing</MenuItem>
                      <MenuItem value="deployment">Deployment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Context"
                    multiline
                    rows={2}
                    value={wizardData.context.additional || ''}
                    onChange={(e) => updateWizardData('context', {
                      ...wizardData.context,
                      additional: e.target.value
                    })}
                    placeholder="Any additional context, constraints, or specific requirements..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Type Recommendation */}
          {wizardData.context.suggestedType && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  AI Recommendation
                </Typography>
                <Typography variant="body2" paragraph>
                  Based on your input analysis, we recommend using a <strong>{wizardData.context.suggestedType}</strong> document type.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => updateWizardData('documentType', wizardData.context.suggestedType)}
                >
                  Use Recommendation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Type Preview */}
          {wizardData.documentType && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Document Preview
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {availableTypes.find(t => t.id === wizardData.documentType)?.preview}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderTemplateCustomization = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ mr: 1 }} />
        Templates & Customization
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Choose a template and customize the document structure. Templates provide pre-built sections and formatting optimized for your document type.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Template Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Template Selection
              </Typography>

              <RadioGroup
                value={wizardData.selectedTemplate || ''}
                onChange={(e) => updateWizardData('selectedTemplate', e.target.value)}
              >
                <FormControlLabel
                  value="auto"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">Auto-Generated Template</Typography>
                      <Typography variant="caption" color="textSecondary">
                        AI will create an optimized template based on your content
                      </Typography>
                    </Box>
                  }
                />

                {availableTemplates
                  .filter(t => t.category === wizardData.documentType)
                  .map((template) => (
                    <FormControlLabel
                      key={template.id}
                      value={template.id}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body2">{template.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {template.description} • {template.sections.length} sections
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Structure Customization */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Structure Customization
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={wizardData.options.includeTableOfContents || false}
                    onChange={(e) => updateWizardData('options', {
                      ...wizardData.options,
                      includeTableOfContents: e.target.checked
                    })}
                  />
                }
                label="Include Table of Contents"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={wizardData.options.includeExecutiveSummary || false}
                    onChange={(e) => updateWizardData('options', {
                      ...wizardData.options,
                      includeExecutiveSummary: e.target.checked
                    })}
                  />
                }
                label="Include Executive Summary"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={wizardData.options.includeMarketInsights || false}
                    onChange={(e) => updateWizardData('options', {
                      ...wizardData.options,
                      includeMarketInsights: e.target.checked
                    })}
                  />
                }
                label="Include Market Insights (PreCog)"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Template Preview */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Template Structure Preview
              </Typography>

              {templatePreview ? (
                <List dense>
                  {templatePreview.sections.map((section, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Typography variant="caption">{index + 1}.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={section.name}
                        secondary={section.description}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          edge="end"
                          checked={section.included}
                          onChange={(e) => {
                            // Toggle section inclusion
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Select a template to see the structure preview
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGenerationOptions = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AutoAwesomeIcon sx={{ mr: 1 }} />
        Generation Options
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Configure AI generation settings and select output formats for your document.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* AI Settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                AI Generation Settings
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Content Expansion Level
                </Typography>
                <Slider
                  value={wizardData.options.expansionLevel || 50}
                  onChange={(e, value) => updateWizardData('options', {
                    ...wizardData.options,
                    expansionLevel: value
                  })}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) =>
                    value < 30 ? 'Minimal' :
                    value < 70 ? 'Standard' : 'Comprehensive'
                  }
                  marks={[
                    { value: 0, label: 'Minimal' },
                    { value: 50, label: 'Standard' },
                    { value: 100, label: 'Comprehensive' }
                  ]}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Quality vs Speed
                </Typography>
                <Slider
                  value={wizardData.options.qualitySpeed || 50}
                  onChange={(e, value) => updateWizardData('options', {
                    ...wizardData.options,
                    qualitySpeed: value
                  })}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) =>
                    value < 30 ? 'Fast' :
                    value < 70 ? 'Balanced' : 'High Quality'
                  }
                  marks={[
                    { value: 0, label: 'Fast' },
                    { value: 50, label: 'Balanced' },
                    { value: 100, label: 'Quality' }
                  ]}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={wizardData.options.enableWritingAssistant || true}
                    onChange={(e) => updateWizardData('options', {
                      ...wizardData.options,
                      enableWritingAssistant: e.target.checked
                    })}
                  />
                }
                label="Enable Writing Assistant Enhancement"
              />
            </CardContent>
          </Card>

          {/* Output Formats */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Output Formats
              </Typography>

              <Grid container spacing={1}>
                {availableFormats.map((format) => (
                  <Grid item key={format.id} xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={wizardData.formats.includes(format.id)}
                          onChange={(e) => {
                            const formats = e.target.checked
                              ? [...wizardData.formats, format.id]
                              : wizardData.formats.filter(f => f !== format.id);
                            updateWizardData('formats', formats);
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{format.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format.extension}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Generation Preview */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Generation Summary
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon><ArticleIcon /></ListItemIcon>
                  <ListItemText
                    primary="Document Type"
                    secondary={availableTypes.find(t => t.id === wizardData.documentType)?.name || 'Not selected'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText
                    primary="Template"
                    secondary={wizardData.selectedTemplate === 'auto' ? 'Auto-generated' :
                              availableTemplates.find(t => t.id === wizardData.selectedTemplate)?.name || 'Not selected'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon><DataObjectIcon /></ListItemIcon>
                  <ListItemText
                    primary="Output Formats"
                    secondary={wizardData.formats.length > 0 ?
                              wizardData.formats.join(', ') : 'None selected'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon><SpeedIcon /></ListItemIcon>
                  <ListItemText
                    primary="Estimated Generation Time"
                    secondary={`${Math.round(wizardData.input.length / 100 * (wizardData.options.qualitySpeed || 50) / 50)}s`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGenerateReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <DescriptionIcon sx={{ mr: 1 }} />
        Generate & Review
      </Typography>

      {!isGenerating && !generatedResults && (
        <Box>
          <Typography variant="body2" color="textSecondary" paragraph>
            Ready to generate your document! Review the configuration below and click Generate to start.
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Configuration Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Input Length:</Typography>
                  <Typography variant="body2">{wizardData.input.length} characters</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Document Type:</Typography>
                  <Typography variant="body2">{wizardData.documentType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Output Formats:</Typography>
                  <Typography variant="body2">{wizardData.formats.join(', ')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">AI Enhancement:</Typography>
                  <Typography variant="body2">
                    {wizardData.options.enableWritingAssistant ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            size="large"
            onClick={startGeneration}
            startIcon={<AutoFixHighIcon />}
            sx={{ mr: 2 }}
          >
            Generate Document
          </Button>
        </Box>
      )}

      {isGenerating && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoFixHighIcon sx={{ mr: 1 }} />
                Generating Document...
              </Typography>

              <LinearProgress variant="determinate" value={generationProgress} sx={{ mb: 2 }} />

              <Typography variant="body2" color="textSecondary">
                {generationStatus} ({generationProgress}%)
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {generatedResults && (
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
            Generation Complete!
          </Typography>

          {/* Results Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {generatedResults.metadata?.sectionsGenerated || 0}
                    </Typography>
                    <Typography variant="caption">Sections</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {generatedResults.metadata?.wordsGenerated || 0}
                    </Typography>
                    <Typography variant="caption">Words</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {Object.keys(generatedResults.results || {}).length}
                    </Typography>
                    <Typography variant="caption">Formats</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {generatedResults.metadata?.qualityScore || 0}%
                    </Typography>
                    <Typography variant="caption">Quality</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Generated Documents */}
          {generatedResults.results && Object.entries(generatedResults.results).map(([format, result]) => (
            <Accordion key={format}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CodeIcon sx={{ mr: 1 }} />
                  {format.toUpperCase()} Document
                  <Chip size="small" label={`${result.content?.length || 0} chars`} sx={{ ml: 2 }} />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => {
                      setTemplatePreview(result);
                      setPreviewOpen(true);
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const blob = new Blob([result.content], { type: result.mimeType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = result.filename;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </Button>
                </Box>

                <Paper
                  sx={{
                    p: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem'
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {result.content?.substring(0, 1000)}
                    {result.content?.length > 1000 && '...'}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ mr: 2, fontSize: 'inherit' }} />
          Smart Document Generator
        </Typography>

        <Typography variant="body1" color="textSecondary" paragraph>
          Generate comprehensive documents using advanced AI with intelligent templates, context-awareness, and multi-format output.
        </Typography>

        {/* Breadcrumbs */}
        <Breadcrumbs>
          {steps.map((step, index) => (
            <Link
              key={index}
              color={index <= activeStep ? "primary" : "textSecondary"}
              component="button"
              variant="body2"
              onClick={() => index < activeStep && setActiveStep(index)}
              sx={{
                textDecoration: 'none',
                cursor: index < activeStep ? 'pointer' : 'default'
              }}
            >
              {step.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {/* Progress Indicator */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={(activeStep / (steps.length - 1)) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              icon={step.icon}
              optional={
                <Typography variant="caption">{step.description}</Typography>
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {renderStepContent(index)}
              </Box>

              <Box sx={{ mb: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                  disabled={isGenerating}
                >
                  {index === steps.length - 1 ? 'Finish' : 'Continue'}
                </Button>
                <Button
                  disabled={index === 0 || isGenerating}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        <SpeedDialAction
          icon={<HelpIcon />}
          tooltipTitle="Help"
          onClick={() => setHelpOpen(true)}
        />
        <SpeedDialAction
          icon={<SaveIcon />}
          tooltipTitle="Save Configuration"
          onClick={() => {
            localStorage.setItem('wizardData', JSON.stringify(wizardData));
          }}
        />
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Reset Wizard"
          onClick={() => {
            setActiveStep(0);
            setWizardData({
              input: '',
              documentType: '',
              context: {},
              options: {},
              templates: [],
              formats: ['markdown'],
              customization: {}
            });
          }}
        />
      </SpeedDial>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {templatePreview && (
            <Box sx={{ mt: 2 }}>
              <iframe
                srcDoc={templatePreview.content}
                style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
                title="Document Preview"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Smart Document Generator Help</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            The Smart Document Generator uses advanced AI to create comprehensive documents from your input.
            Follow these steps for best results:
          </Typography>

          <Typography variant="subtitle2" gutterBottom>1. Input Analysis</Typography>
          <Typography variant="body2" paragraph>
            Provide detailed input about what you want to document. The AI will analyze complexity, domain, and context.
          </Typography>

          <Typography variant="subtitle2" gutterBottom>2. Document Type</Typography>
          <Typography variant="body2" paragraph>
            Select the appropriate document type. The AI may suggest the best type based on your input analysis.
          </Typography>

          <Typography variant="subtitle2" gutterBottom>3. Templates</Typography>
          <Typography variant="body2" paragraph>
            Choose a template or let the AI auto-generate one. Customize the structure as needed.
          </Typography>

          <Typography variant="subtitle2" gutterBottom>4. Generation Options</Typography>
          <Typography variant="body2" paragraph>
            Configure AI settings and select output formats. Higher quality settings take longer but produce better results.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartDocumentWizard;