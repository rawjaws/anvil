# Anvil

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)]()

## Overview

**An AI-Powered No-Code Development Framework** that takes you from **Idea → Requirements → Design → Code → Test** without writing a single line of code.

Anvil provides a clean, organized interface for defining product specifications that automatically transform into working software through AI-powered development workflows.

Anvil is not just a PRD management tool - it's a complete product development pipeline that transforms ideas into working software. Define your product requirements using structured capabilities and enablers, then watch as AI automatically generates your entire application with comprehensive testing through seamless integration with Claude Code and other AI development tools.

**Complete Development Pipeline:**
- 💡 **Idea**: Capture and organize product concepts
- 📋 **Requirements**: Structure capabilities, enablers, and detailed specifications
- 🎨 **Design**: Automated system architecture and component design
- ⚙️ **Code**: AI-generated implementation with full functionality
- 🧪 **Test**: Automated test generation and validation
- 🚀 **Deploy**: Ready-to-run applications from your specifications

### Philosophy & Focus

Anvil is specifically designed for the **right side of the engineering problem** - the **Technical Capabilities and Enablers** that form the architectural foundation of software systems.

Product development has two distinct sides:
- **Left Side (Creative Design Space)**: Experiences and Features - the domain of Product Managers and UX designers
- **Right Side (Technical Implementation)**: Technical Capabilities and Enablers - the domain of Engineers and Architects

Anvil focuses exclusively on the right side, helping engineering teams define, organize, and manage the technical capabilities that enable product experiences. A new platform is coming soon for the left side that will marry **Experiences and Features** (Product Managers) with **Technical Capabilities and Enablers** (Engineers) to build the architectural runway needed to support exceptional user experiences.

## Application Interface

<div align="center">
  <img src="https://raw.githubusercontent.com/darcydjr/anvil/main/docs/anvil-screenshot.png" alt="Anvil Application Screenshot" width="600">
  <br>
  <em>Anvil's clean interface showing capability management with structured metadata, enabler relationships, and comprehensive status tracking</em>
</div>

## Quick Start

### Launch Anvil

**Windows:**
```bash
start-anvil.bat
```

**Mac/Linux:**
```bash
chmod +x start-anvil.sh
./start-anvil.sh
```

**Manual Start:**
```bash
npm install  # First time only
npm start    # Start the server
```

The start scripts will:
- Automatically install dependencies if needed
- Start the Anvil server
- Open at http://localhost:3000

### Launch Claude Code for Implementation

Once you have your specifications ready in Anvil:

1. **Navigate to Project Directory**:
   ```bash
   cd /path/to/your/project
   ```
   (This should be the parent folder that contains your `specifications/` folder with capabilities and enablers)

2. **Launch Claude Code**:
   ```bash
   claude
   ```

3. **Implementation Command**:
   ```
   Please implement this application by looking in the specifications folder and following the development plan closely.
   ```

## Implementation Workflow

Anvil is designed to work seamlessly with Claude Code for automated development implementation:

### Step 1: Product Definition in Anvil
1. **Create Capabilities**: Define high-level system capabilities using Anvil's capability forms
2. **Add Enablers**: Break down capabilities into detailed enablers with requirements
3. **Set Status Fields**: Configure Analysis Review and Design Review requirements for each document
4. **Development Plans**: Ensure each enabler includes a comprehensive Development Plan section

### Step 2: Automated Development Sequence
Claude Code will automatically:

1. **📋 Analysis Phase** (if Analysis Review = "Required"):
   - Read all capability and enabler specifications
   - Analyze requirements and dependencies
   - Generate technical analysis documentation
   - Update Status: "Ready for Analysis" → "In Analysis" → "Ready for Design"

2. **🎨 Design Phase** (if Design Review = "Required"):
   - Create system architecture designs
   - Design component interfaces and APIs
   - Generate design documentation
   - Update Status: "Ready for Design" → "In Design" → "Ready for Implementation"

3. **⚙️ Implementation Phase**:
   - Generate code following development plans
   - Implement functional and non-functional requirements
   - Create tests and documentation
   - Update Status: "Ready for Implementation" → "In Implementation" → "Implemented"

4. **🔄 Status Synchronization**:
   - Automatically update Anvil document statuses
   - Sync requirement completion states
   - Trigger automated workflow transitions

### Implementation Tips
- **Detailed Development Plans**: Include specific implementation steps, file structures, and dependencies
- **Clear Requirements**: Use Functional and Non-Functional requirement tables with priorities
- **Status Configuration**: Set Analysis Review and Design Review to "Required" for comprehensive implementation
- **Directory Structure**: Organize specifications in logical system/component folders for Claude to navigate
- **Regular Sync**: Refresh Anvil after implementation phases to see updated statuses

## Features

### Document Organization
- **Capabilities Section**: High-level capability documents
- **Enablers Section**: Detailed feature enabler documents
- **Templates Section**: Template files for creating new documents
- Automatic categorization based on Type metadata field

### Metadata System
- **Type**: Automatically categorizes documents (Capability, Enabler, Template)
- **ID**: Unique identifier (CAP-XXXX for capabilities, ENB-XXXX for enablers)
- **Description**: Brief description extracted and displayed in navigation
- **Title**: Clean titles without redundant prefixes

### User Interface
- Responsive design with editor swap-in functionality
- Clean, modern design with gradient header
- Mobile-responsive design
- Hover effects and active states for navigation items

### Document Creation & Management
- **Create New Capabilities**: Generate new capability documents from templates
- **Create New Enablers**: Generate new enabler documents from templates
- **Smart Template Loading**: Automatically populates metadata with current date and generated IDs
- **Form-based Editor**: User-friendly web forms with markdown editing toggle
- **Auto-naming Convention**: Ensures proper file naming (-capability.md, -enabler.md)

## Architecture

### Frontend (React)
- **Framework**: React 18 with Vite for fast development and building
- **State Management**: React Context for global application state
- **Routing**: React Router for client-side navigation
- **Styling**: CSS modules with modern responsive design

### Backend (Node.js + Express)
- **Server**: Express.js REST API
- **File Operations**: Markdown file management and parsing
- **APIs**: RESTful endpoints for CRUD operations
- **Agent System**: Orchestrator-based subagent management

### AI Agent Layer
- **Orchestrator**: Central command system managing all subagents
- **Router**: Intelligent request routing to appropriate agents
- **Job Queue**: Concurrent execution with history tracking
- **Event System**: Real-time status updates and notifications

## Configuration

Anvil supports **workspace-based configuration** for managing multiple document collections:

### Workspace Features
- **Multiple Workspaces**: Create and manage multiple independent workspaces
- **Multi-Path Support**: Each workspace can have multiple project paths for document storage
- **Active Workspace**: Only one workspace is active at a time, determining which documents are visible
- **Centralized Templates**: Single templates directory shared across all workspaces

### Configuration Structure (config.json)
```json
{
  "workspaces": [
    {
      "id": "ws-default",
      "name": "Default Workspace",
      "description": "Primary document workspace",
      "isActive": true,
      "projectPaths": ["../specifications", "./docs"],
      "createdDate": "2025-09-17T22:30:00.000Z"
    }
  ],
  "activeWorkspaceId": "ws-default",
  "templates": "./templates",
  "server": { "port": 3000 },
  "ui": {
    "title": "Anvil",
    "description": "Product Requirements Document Browser"
  }
}
```

## API Endpoints

- `GET /api/capabilities` - Returns categorized documents (capabilities, enablers, templates)
- `GET /api/file/*` - Returns specific file content with rendered HTML
- `GET /api/workspaces` - Get all workspaces and active workspace ID
- `POST /api/workspaces` - Create new workspace
- `GET /api/agents` - List all AI agents
- `POST /api/agents/analyze` - Analyze documents with AI

## Dependencies

### Server Dependencies
- **express**: Web server framework
- **marked**: Markdown parsing and rendering
- **fs-extra**: Enhanced file system operations
- **uuid**: Unique ID generation for agent jobs

### Client Dependencies
- **react**: UI framework
- **react-router-dom**: Client-side routing
- **axios**: HTTP client for API calls
- **lucide-react**: Icon library
- **mermaid**: Diagram rendering

## Release Notes & Version History

### v2.0.0 - Claude Code AI Subagent System ✅

#### 🤖 **NEW: AI-Powered Development Automation**
Anvil now includes a comprehensive **Claude Code Subagent System** that transforms your specifications into working software through AI-orchestrated workflows.

**Key Features:**
- **Agent Control Center**: Access via Bot icon (🤖) in header or navigate to `/agents`
- **Requirements Analyzer**: Analyzes and validates capabilities and enablers with metadata extraction, completeness validation, dependency checks, and improvement suggestions
- **Predefined Workflows**: Full Implementation Pipeline, Quick Analysis, Design Only, Test Generation
- **Agent API Endpoints**: Complete REST API for agent management and execution
- **Real-time Monitoring**: Job queue with progress tracking and execution history

**Available Agents:**
- ✅ **Requirements Analyzer**: Analyzes and validates capabilities and enablers
- 🔄 **Design Architect** *(Coming Soon)*: Creates system designs from requirements
- 🔄 **Code Generator** *(Coming Soon)*: Generates implementation code
- 🔄 **Test Automator** *(Coming Soon)*: Creates comprehensive test suites
- 🔄 **Documentation Generator** *(Coming Soon)*: Produces technical documentation

#### 📋 **Components → Capabilities → Enablers → Requirements Model**
- **ARCHITECTURAL REDESIGN**: Updated core framework to implement hierarchical model where Components have Capabilities, and Enablers implement Capabilities by adhering to Requirements
- **METADATA ENHANCEMENT**: Added System and Component fields to capability metadata, plus Analysis Review and Code Review fields to enablers
- **DOCUMENTATION UPDATE**: Updated SOFTWARE_DEVELOPMENT_PLAN.md with new conceptual model and complete metadata field specifications
- **EXAMPLE CLEANUP**: Removed Development Plan sections from all example files to follow new clean specification format
- **TEMPLATE CONSISTENCY**: Updated document templates to match actual form editor metadata fields

#### 🔧 **Infrastructure Improvements**
- **PLAN ACCESSIBILITY**: Fixed SOFTWARE_DEVELOPMENT_PLAN.md accessibility by using static file serving approach like README
- **WORKSPACE INTEGRATION**: Added root directory to workspace configuration for better file access
- **CLIENT REBUILD**: Updated client build to reflect header component changes

### v1.1.3 - Mermaid Diagram Fix ✅
- **RELATIONSHIP DIAGRAM FIX**: Fixed Mermaid parsing error that caused "Parse error on line 15" when rendering component relationship diagrams
- **ROBUST ID GENERATION**: Improved node ID generation to ensure valid Mermaid identifiers by replacing special characters with underscores

### v1.1.2 - Discovery UI Updates ✅
- **DISCOVERY ICON**: Changed Discovery icon from search to lightbulb with consistent blue styling
- **FEATURE STATUS**: Added "Feature Not Yet Implemented" notice banner to Discovery page

### v1.1.1 - Discovery Feature and Smart Rebuild ✅
- **DISCOVERY FEATURE**: Added Discovery page with markdown-capable text editor and AI analysis engine
- **SMART REBUILD DETECTION**: Enhanced startup scripts to detect client changes and automatically rebuild when needed

### v1.0.2 - Defect Fixes and Version Management ✅
- **DUPLICATE ENABLER FIX**: Fixed duplicate enabler file creation issue
- **CENTRALIZED VERSION MANAGEMENT**: Updated all code to use package.json as single source of truth for version information

### v1.0.0 - Initial Open Source Release ✅
- **APACHE 2.0 LICENSE**: Released under Apache 2.0 license with full open source compliance
- **COMPREHENSIVE FEATURE SET**: Complete PRD management system with capabilities, enablers, and requirements tracking
- **REACT + NODE.JS**: Modern full-stack application with React frontend and Node.js Express backend

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Copyright

Copyright 2025 Darcy Davidson

## Acknowledgments

- Built with React and Node.js
- Uses Lucide React for icons
- Markdown rendering with marked.js
- Diagram support via Mermaid.js