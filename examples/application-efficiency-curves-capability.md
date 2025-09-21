# Application Efficiency Curves

## Metadata
- **Name**: Application Efficiency Curves
- **Type**: Capability
- **System**: Automotive Resource Modeling
- **Component**: Efficiency Modeling Engine
- **ID**: CAP-007
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: High
- **Analysis Review**: Required
- **Owner**: Engineering Team
- **Created Date**: 2025-09-19
- **Last Updated**: 2025-09-19
- **Version**: 1.0

## Technical Overview
### Purpose
Provides configurable efficiency curve modeling for vehicle program applications based on learning curve effects. This capability enables users to define efficiency curves either globally across all domains or per-domain, accounting for the fact that subsequent applications of a platform become more efficient due to learning effects and process optimization.

## Enablers
List of enablers that implement this capability:

| Enabler ID | Name | Description | Status | Approval | Priority |
|------------|------|-------------|--------|----------|----------|
| ENB-021 | Efficiency Configuration Management | Platform-specific efficiency tables with global vs per-domain options | In Draft | Not Approved | High |
| ENB-022 | Domain-Specific Efficiency Application | Toggle and apply efficiency curves per domain or globally | In Draft | Not Approved | High |
| ENB-023 | Platform-Specific Efficiency Calculation | Independent efficiency curves per platform with user-defined values | In Draft | Not Approved | High |
| ENB-024 | Efficiency Application Engine | Apply efficiency multipliers to resource calculations | In Draft | Not Approved | High |

## Dependencies
### Internal Upstream Dependency
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-001 | Excel VBA Framework | Provides VBA infrastructure and configuration management |
| CAP-003 | Program & Platform Modeling | Provides application sequence tracking for efficiency application |

### Internal Downstream Impact
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-004 | Calendarization & Resource Allocation | Uses efficiency-adjusted resources for timeline calculations |
| CAP-005 | User Interface & Configuration | Displays efficiency configuration options |
| CAP-006 | Data Management | Stores efficiency curve configurations |

### External Upstream Dependencies
- Platform optimization level assessments from engineering teams
- Historical learning curve data from previous vehicle programs
- Domain-specific efficiency patterns from past projects

### External Downstream Impact
- More accurate resource planning reflecting real-world learning effects
- Better cost estimation for subsequent vehicle programs
- Improved platform ROI calculations

## Technical Specifications

### Capability Dependency Flow Diagram
```mermaid
flowchart TD
    %% External Inputs
    OPTIMIZATION["Platform Optimization<br/>Level Assessments<br/>📊"]
    HISTORICAL["Historical Learning<br/>Curve Data<br/>📈"]
    PATTERNS["Domain-Specific<br/>Efficiency Patterns<br/>🔍"]

    %% Upstream Dependencies
    CAP001["CAP-001<br/>Excel VBA Framework<br/>🏗️"]
    CAP003["CAP-003<br/>Program & Platform Modeling<br/>🚗"]

    %% Current Capability
    CAP007["CAP-007<br/>Application Efficiency Curves<br/>⚡"]

    %% Downstream Dependencies
    CAP004["CAP-004<br/>Calendarization & Resource Allocation<br/>📅"]
    CAP005["CAP-005<br/>User Interface & Configuration<br/>🖥️"]
    CAP006["CAP-006<br/>Data Management<br/>💾"]

    %% External Outputs
    OUTPUT1["Accurate Resource Planning<br/>with Learning Effects<br/>🎯"]
    OUTPUT2["Better Cost Estimation<br/>for Programs<br/>💰"]
    OUTPUT3["Improved Platform<br/>ROI Calculations<br/>📊"]

    %% Dependencies Flow
    OPTIMIZATION --> CAP007
    HISTORICAL --> CAP007
    PATTERNS --> CAP007

    CAP001 --> CAP007
    CAP003 --> CAP007

    CAP007 --> CAP004
    CAP007 --> CAP005
    CAP007 --> CAP006

    CAP004 --> OUTPUT1
    CAP005 --> OUTPUT2
    CAP006 --> OUTPUT3

    %% Styling
    classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef internal fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef input fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef output fill:#f1f8e9,stroke:#689f38,stroke-width:2px

    class CAP007 current
    class CAP001,CAP003,CAP004,CAP005,CAP006 internal
    class OPTIMIZATION,HISTORICAL,PATTERNS input
    class OUTPUT1,OUTPUT2,OUTPUT3 output

    %% Capability Grouping
    subgraph SYSTEM ["Automotive Resource Modeling System"]
        subgraph CORE ["Core Framework"]
            CAP001
        end
        subgraph BUSINESS ["Business Logic"]
            CAP003
            CAP007
        end
        subgraph FEATURES ["Feature Capabilities"]
            CAP004
            CAP005
            CAP006
        end
    end

    subgraph INPUTS ["External Inputs"]
        OPTIMIZATION
        HISTORICAL
        PATTERNS
    end

    subgraph OUTPUTS ["External Outputs"]
        OUTPUT1
        OUTPUT2
        OUTPUT3
    end
```

### Efficiency Curve Architecture
The Application Efficiency Curves capability provides:

1. **Global Efficiency Mode**: Apply same efficiency curve to all domains
2. **Per-Domain Efficiency Mode**: Custom efficiency curves for each work domain
3. **Platform Independence**: Each platform has its own efficiency configuration
4. **User-Defined Values**: Efficiency percentages based on platform optimization level
5. **Flexible Configuration**: Support up to 30 vehicle programs per platform

### Efficiency Configuration Options

#### Global Efficiency Example:
```
Platform A - Global Efficiency:
Vehicle 1: 100%  Vehicle 2: 80%  Vehicle 3: 65%  Vehicle 4: 55%...
```

#### Per-Domain Efficiency Example:
```
Platform A - Per Domain:
                V1    V2    V3    V4 ...
Design:        100%   80%   65%   55%
SW Dev:        100%   85%   70%   60%
V&V:           100%   75%   60%   50%
DevSecOps:     100%   80%   65%   55%
OTA:           100%   90%   80%   75%
Release:       100%   85%   75%   70%
QA:            100%   80%   70%   60%
```

### Platform-Specific Examples

#### Well-Optimized Platform (gradual efficiency gains):
```
Platform X: Vehicle 1=100%, Vehicle 2=90%, Vehicle 3=85%, Vehicle 4=82%...
```

#### Less-Optimized Platform (significant efficiency gains):
```
Platform Y: Vehicle 1=100%, Vehicle 2=70%, Vehicle 3=50%, Vehicle 4=40%...
```

### Resource Calculation Integration
```
Final Resource = Base Resource × Platform Multiplier × Efficiency Multiplier

Where Efficiency Multiplier comes from:
- Global Mode: Platform efficiency table [Vehicle Sequence]
- Per-Domain Mode: Platform efficiency table [Domain][Vehicle Sequence]
```

### Technical Requirements
- **Platform Support**: Independent efficiency curves for up to 10 platforms
- **Vehicle Programs**: Support up to 30 programs per platform
- **Domain Support**: All 7 work domains with individual configuration
- **Performance**: Calculate efficiency multipliers for all programs in under 1 second
- **Validation**: Ensure efficiency percentages are between 1% and 100%
- **Configuration Storage**: Persistent storage of efficiency curve configurations

# Development Plan

## CRITICAL WORKFLOW RULES

### APPROVAL vs STATE - FUNDAMENTAL DIFFERENCE:
- **Approval Definition**: Authorization/permission to proceed when workflow reaches appropriate state
- **State**: Current position in the development workflow that MUST be followed sequentially
- **Pre-condition Verification**: Never change value of a condition to make the condition true. This is not a set.
- **KEY RULE**: NEVER skip states even if approved - approval only grants permission, not workflow bypass
- **ZERO TOLERANCE**: Never modify pre-condition values.

### STATE MACHINE COMPLIANCE:
- Always respect the current **State** field value
- Follow tasks order in strict sequential order
- Each task moves the enabler to the next appropriate state
- Approval status does NOT override state requirements

### FORBIDDEN SHORTCUTS:
- Do NOT jump out of task order
- Do NOT skip analysis, design, or review phases based on approval alone
- Do NOT assume any workflow steps are complete without verifying state progression

## Task 1: Approval Verification (MANDATORY)
**Purpose**: Ensure proper authorization before proceeding with any implementation tasks.

### Pre-Conditions Verification
| Condition | Required Value | Action if True | Action if False |
|-------|----------------|------------------|------------------|
| Capability Approval | "Approved" | Continue to next task | Stop all processing, Respond with "Capability not approved."  |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Exit Criteria Checklist
-[ ] Both approval statuses verified
-[ ] Decision made (proceed/stop)
-[ ] Appropriate response provided

---

## Task 2: Analysis
**Purpose**: Analyze the current capability and determine what new enablers or modifications need to be made.

### Pre-Conditions Verification
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|----------------|-----------------|
| Task 1 Completion | Must be "Passed" | Continue to next condition check | STOP - explain why you are stopping |
| Capability Status | "Ready for Analysis" | Continue to Analysis Process Section | SKIP to Task 3: Design |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Perform Analysis
| Step | Action | Result |
|------|--------|--------|
| 1 | Verify pre-conditions | ALL must be met |
| 2 | Set Capability Status | "In Analysis" |
| 3 | Generate new Enablers, add Enablers to Capability List and Create the actual Enabler files, ensure you include the Technical Specifications section from the Enabler Template| Analyze the Capability and create new Enablers |
| 4 | Configure Enablers | Apply Enabler Configuration Rules below |

### Enabler Configuration Rules
| Enabler Analysis Review Setting | Enabler Approval | Enabler Status | Enabler Priority |
|------------------------|---------------------|-------------------|-------------------|
| "Required" | "Pending" | "In Draft" | "High" or "Medium" or "Low" |
| "Not Required" | "Approved" | "Ready for Analysis" | "High" or "Medium" or "Low" |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Ready for Design"

### Exit Criteria Checklist
- [ ] All new Enablers added to Capability
- [ ] All Enablers have appropriate Approval and Status set following the Enabler Configuration Rules

### Critical Rules
- Do NOT modify existing Enablers
- Create copies as new Enablers if improvements needed
- ONLY explicitly obtained user approval can change Approval to "Approved"

---

## Task 3: Design
**Purpose**: Create a design based only on approved and ready to implement Enablers by following the sections below.

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Capability Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Capability Status | "Ready for Design" | continue to next section | SKIP to Task 4: Develop the Enablers |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Perform Design
| Step | Action | Requirement |
|------|--------|-------------|
| 1 | Verify pre-conditions | ALL must be met |
| 2 | Set Capability Status | "In Design" |
| 3 | Display the Enablers you are using in the design. Following the Enabler State Processing below and only for Enablers in Approval = "Approved"
| 4 | Do the design by updating the Technical Specification documenting and updating All applicable sections using only the Enabler outlined in the Enabler State Processing below and only Enabler in Approval = "Approved" |

### Enabler State Processing
| Enabler State | Action |
|------------------|--------|
| "In Draft" | Do NOT include in design |
| "Ready for Analysis" | Include in design |
| "Ready for Design" | Include in design |
| "Ready for Implementation" | Include in design |
| "Ready for Refactor" | Include in design |
| "Ready for Retirement" | Remove from design completely |

### Documentation Requirements
| Section | Content | If Not Applicable |
|---------|---------|-------------------|
| Technical Specifications | Main design | Required |
| Document any Dependency Flow Diagrams in the Capability Dependency Flow Diagrams Section | Flow diagrams | Mark "Not Applicable" if not applicable |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Capability Status "Ready for Implementation"

### Absolute Prohibitions (ZERO TOLERANCE)
- 🚫 Never bypass for any reason whatsoever
- 🚫 Never write implementation code during this task
- 🚫 Never used unapproved or not ready to implement requirements in design

---

## Task 4: Develop the Enablers (by Following the Enablers Development Plan)
**Purpose**: Develop the Enabler the by following the Enablers Development Plan very closely

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Capability Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Capability Status | "Ready for Implementation" | continue to next section | SKIP to Task 5: Refactor |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Develop Enabler
|Step | Condition | Required Value | Action if True | Action if False |
|------|---------------------|----------------|---------|----------------------|
| 1 | Enabler Approval | "Approved" | Develop  Enabler following the Enabler's Development Plan | IMMEDIATE STOP |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Implemented"

### Exit Criteria Checklist
- [ ] Implementation completed for all approved requirements
- [ ] Requirement Status updated appropriately
- [ ] Unapproved requirements skipped
- [ ] Enabler State set to "Implemented"