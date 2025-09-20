# Anvil Feature System Guide

## Overview
The Anvil Feature System provides a robust, configurable way to enable/disable features throughout the application. This guide explains how the system works and how to troubleshoot common issues.

## Architecture

### Configuration Files
- **`config.json`** - Main configuration file containing all feature definitions and defaults
- **`config.local.json`** - Local overrides for development/testing (optional)

### Key Components
1. **Backend API** (`/api/feature-endpoints.js`) - RESTful endpoints for feature management
2. **Frontend Context** (`/src/contexts/FeatureContext.jsx`) - React context for feature state
3. **Utilities** (`/src/utils/featureUtils.js`) - Feature registry and validation functions
4. **UI Components** - Feature management dashboard and controls

## Configuration Loading Logic

### Important: Configuration Merge Behavior
The system uses a hierarchical configuration loading approach:

1. **Always loads `config.json` first** - This contains the complete feature definitions
2. **Optionally merges `config.local.json`** - For local development overrides
3. **Features section merging**: `{...mainConfig.features, ...localConfig.features}`

### Common Issue: Empty Features List
**Problem**: Feature management page shows no features
**Cause**: API only reading from `config.local.json` which doesn't contain features section
**Solution**: Ensure `loadConfig()` function in `feature-endpoints.js` always loads main config first

```javascript
// CORRECT - Always load main config first
const mainConfig = await fs.readJson(configPath)
let config = mainConfig

if (localConfigExists) {
  const localConfig = await fs.readJson(localConfigPath)
  config = {
    ...mainConfig,
    ...localConfig,
    features: {
      ...mainConfig.features,    // Main features
      ...localConfig.features    // Local overrides
    }
  }
}
```

## Feature Registry

### Supported Features (as of current implementation)
1. **Advanced Analytics** - Enhanced dashboard with charts and metrics
2. **Enhanced Exporting** - PDF, Excel, and custom format exports
3. **Collaborative Reviews** - Real-time collaboration with comments and approvals
4. **AI Workflow Automation** - AI-powered analysis and suggestions
5. **Template Marketplace** - Shareable template library
6. **Requirements Precision Engine** - Advanced validation and quality assurance

### Feature Structure
```json
{
  "featureId": {
    "enabled": boolean,
    "config": {
      "configKey1": boolean,
      "configKey2": boolean,
      ...
    }
  }
}
```

## API Endpoints

### Core Endpoints
- `GET /api/features` - List all features with metadata
- `GET /api/features/:featureId` - Get specific feature configuration
- `PUT /api/features/:featureId` - Update feature configuration
- `POST /api/features/:featureId/toggle` - Toggle feature enabled/disabled
- `POST /api/features/batch-update` - Update multiple features
- `GET /api/features/status` - Get system status and health
- `POST /api/features/reset` - Reset features to defaults

### Response Format
```json
{
  "success": boolean,
  "features": { ... },
  "metadata": {
    "totalFeatures": number,
    "enabledFeatures": number
  }
}
```

## Frontend Integration

### Using Features in Components
```javascript
import { useFeatures } from '../contexts/FeatureContext'

function MyComponent() {
  const { features, isFeatureEnabled } = useFeatures()

  if (isFeatureEnabled('advancedAnalytics')) {
    return <AdvancedDashboard />
  }

  return <BasicDashboard />
}
```

### Feature Gates
```javascript
import { FeatureGate } from '../utils/featureUtils'

<FeatureGate
  feature="requirementsPrecisionEngine"
  features={features}
  fallback={<ComingSoon />}
>
  <RequirementsPrecision />
</FeatureGate>
```

## Troubleshooting

### Issue: Features Not Loading
1. Check server startup logs for feature configuration
2. Verify `config.json` contains features section
3. Test API endpoint: `curl http://localhost:3000/api/features`
4. Ensure `loadConfig()` function loads main config first

### Issue: Feature Changes Not Persisting
1. Check if changes are being saved to correct file (local vs main)
2. Verify file permissions for write access
3. Review `saveConfig()` function logic

### Issue: Frontend Not Reflecting Feature State
1. Verify FeatureContext is properly initialized
2. Check if component is subscribed to feature updates
3. Ensure feature state is being fetched from API

## Development Guidelines

### Adding New Features
1. Add feature definition to `FEATURE_REGISTRY` in `featureUtils.js`
2. Add default configuration to `config.json`
3. Create feature-specific components
4. Add feature gates where appropriate
5. Update documentation

### Testing Features
1. Use local config overrides for testing
2. Test both enabled and disabled states
3. Verify dependencies are handled correctly
4. Check API endpoints with various configurations

## File Locations
- Configuration: `/config.json`, `/config.local.json`
- Backend API: `/api/feature-endpoints.js`
- Frontend Context: `/client/src/contexts/FeatureContext.jsx`
- Utilities: `/client/src/utils/featureUtils.js`
- Components: `/client/src/components/`

## Best Practices
1. Always test feature toggles in both states
2. Use feature gates for conditional rendering
3. Keep feature configurations simple and boolean-focused
4. Document feature dependencies clearly
5. Use semantic feature names and descriptions
6. Implement graceful fallbacks for disabled features

---

*Last updated: 2025-09-20*
*System version: 1.1.7*