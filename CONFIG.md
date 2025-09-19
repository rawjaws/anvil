# Configuration Management

Anvil uses a factory + local override configuration pattern to separate shipped defaults from runtime configuration.

## Configuration Files

### `config.json` (Factory Defaults)
- **Committed to Git**: Contains factory default settings
- **Read-only at runtime**: Never modified by the application
- **Safe to distribute**: Contains no sensitive or environment-specific data

### `config.local.json` (Runtime Overrides)
- **Gitignored**: Never committed to version control
- **Runtime modifications**: All application setting changes are saved here
- **Merged with factory**: Local settings override factory defaults
- **Environment-specific**: Contains your workspace paths, user preferences, etc.

## How It Works

1. **Server Startup**: Loads `config.json` as factory defaults
2. **Local Override Check**: Looks for `config.local.json`
3. **Deep Merge**: Combines factory + local using deep merge logic
4. **Runtime Updates**: All configuration changes save to `config.local.json`

## Configuration Override Examples

### Factory Default (config.json)
```json
{
  "defaults": {
    "owner": "Product Team",
    "analysisReview": "Required"
  },
  "workspaces": [
    {
      "name": "Default Workspace",
      "projectPaths": [{"path": "./examples/specifications"}]
    }
  ]
}
```

### Local Override (config.local.json)
```json
{
  "defaults": {
    "owner": "Darcy Davidson",
    "analysisReview": "Not Required"
  },
  "workspaces": [
    {
      "name": "My Custom Workspace",
      "projectPaths": [{"path": "./examples/simple-example/specifications"}]
    }
  ]
}
```

### Final Merged Configuration
```json
{
  "defaults": {
    "owner": "Darcy Davidson",           // From local override
    "analysisReview": "Not Required"     // From local override
  },
  "workspaces": [
    {
      "name": "My Custom Workspace",     // From local override
      "projectPaths": [{"path": "./examples/simple-example/specifications"}]
    }
  ]
}
```

## Benefits

- ✅ **Git-safe**: Factory defaults can be safely committed
- ✅ **No conflicts**: Local changes don't interfere with updates
- ✅ **Environment isolation**: Each environment has its own runtime config
- ✅ **Easy deployment**: New installations start with clean factory defaults
- ✅ **Upgrade-friendly**: Factory config updates don't overwrite local settings

## First Time Setup

1. **Clone repository**: Get factory defaults in `config.json`
2. **Start Anvil**: Server runs with factory defaults initially
3. **Configure settings**: Use Settings page to customize workspace paths, defaults, etc.
4. **Automatic creation**: `config.local.json` is created automatically with your changes
5. **Persistent settings**: Your local configuration persists across server restarts

## Troubleshooting

### Reset to Factory Defaults
Delete `config.local.json` and restart the server.

### View Current Configuration
Check server startup logs for "Config loaded and validated successfully" message.

### Invalid Configuration
Server falls back to hardcoded defaults if both config files are invalid.