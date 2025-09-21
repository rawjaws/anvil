# Program & Platform Modeling

## Metadata
- **Name**: Program & Platform Modeling
- **Type**: Capability
- **System**: Automotive Resource Modeling
- **Component**: Business Logic Engine
- **ID**: CAP-003
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: Critical
- **Analysis Review**: Required
- **Owner**: Engineering Team
- **Created Date**: 2025-09-19
- **Last Updated**: 2025-09-19
- **Version**: 1.0

## Technical Overview
### Purpose
Provides the core business logic for modeling automotive platform development and vehicle application programs. This capability handles Job 1 date processing, platform-specific multipliers, shared platform work distribution, application sequence tracking, and efficiency curve application for accurate resource modeling.

## Enablers
List of enablers that implement this capability:

| Enabler ID | Name | Description | Status | Approval | Priority |
|------------|------|-------------|--------|----------|----------|
| ENB-007 | Job 1 Timeline Calculation | Calculate development timeline from Job 1 date and program duration | In Draft | Not Approved | Critical |
| ENB-008 | Platform Application Multipliers | Platform-specific multipliers for application work calculation | In Draft | Not Approved | High |
| ENB-009 | Shared Platform Work Distribution | Logic for distributing shared platform work across applications | In Draft | Not Approved | High |
| ENB-019 | Application Sequence Tracking | Track 1st, 2nd, 3rd... application per platform for efficiency curves | In Draft | Not Approved | High |
| ENB-020 | Efficiency Curve Application | Apply efficiency multipliers to resource calculations based on sequence | In Draft | Not Approved | High |

## Dependencies
### Internal Upstream Dependency
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-001 | Excel VBA Framework | Provides VBA infrastructure and error handling |
| CAP-002 | Resource Curve Engine | Provides stretched resource curves for calculations |
| CAP-007 | Application Efficiency Curves | Provides efficiency multipliers for applications |

### Internal Downstream Impact
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-004 | Calendarization & Resource Allocation | Uses program models for timeline generation |
| CAP-005 | User Interface & Configuration | Displays program and platform information |
| CAP-006 | Data Management | Stores program and platform model data |

### External Upstream Dependencies
- Vehicle program Job 1 dates from OEM planning teams
- Platform definitions and characteristics
- Historical application work multipliers

### External Downstream Impact
- Vehicle program resource planning accuracy
- Platform development investment decisions
- Cross-program resource optimization

## Technical Specifications

### Capability Dependency Flow Diagram
```mermaid
flowchart TD
    %% External Inputs
    JOB1["Vehicle Program<br/>Job 1 Dates<br/>📅"]
    PLATFORM["Platform Definitions<br/>& Characteristics<br/>🏗️"]
    HISTORICAL["Historical Application<br/>Work Multipliers<br/>📊"]

    %% Upstream Dependencies
    CAP001["CAP-001<br/>Excel VBA Framework<br/>🔧"]
    CAP002["CAP-002<br/>Resource Curve Engine<br/>📈"]
    CAP007["CAP-007<br/>Application Efficiency Curves<br/>⚡"]

    %% Current Capability
    CAP003["CAP-003<br/>Program & Platform Modeling<br/>🚗"]

    %% Downstream Dependencies
    CAP004["CAP-004<br/>Calendarization & Resource Allocation<br/>📅"]
    CAP005["CAP-005<br/>User Interface & Configuration<br/>🖥️"]
    CAP006["CAP-006<br/>Data Management<br/>💾"]

    %% External Outputs
    OUTPUT1["Vehicle Program<br/>Resource Planning<br/>🎯"]
    OUTPUT2["Platform Development<br/>Investment Decisions<br/>💰"]
    OUTPUT3["Cross-Program<br/>Resource Optimization<br/>🔄"]

    %% Dependencies Flow
    JOB1 --> CAP003
    PLATFORM --> CAP003
    HISTORICAL --> CAP003
    
    CAP001 --> CAP003
    CAP002 --> CAP003
    CAP007 --> CAP003

    CAP003 --> CAP004
    CAP003 --> CAP005
    CAP003 --> CAP006

    CAP004 --> OUTPUT1
    CAP005 --> OUTPUT2
    CAP006 --> OUTPUT3

    %% Styling
    classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef internal fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef input fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef output fill:#f1f8e9,stroke:#689f38,stroke-width:2px

    class CAP003 current
    class CAP001,CAP002,CAP007,CAP004,CAP005,CAP006 internal
    class JOB1,PLATFORM,HISTORICAL input
    class OUTPUT1,OUTPUT2,OUTPUT3 output

    %% Capability Grouping
    subgraph SYSTEM ["Automotive Resource Modeling System"]
        subgraph CORE ["Core Framework"]
            CAP001
            CAP002
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
        JOB1
        PLATFORM
        HISTORICAL
    end

    subgraph OUTPUTS ["External Outputs"]
        OUTPUT1
        OUTPUT2
        OUTPUT3
    end
```

### Program & Platform Architecture
The Program & Platform Modeling capability provides:

1. **Job 1 Timeline Calculation**: Convert Job 1 production dates and program durations into development start dates and milestones
2. **Platform Application Logic**: Calculate application-specific work based on platform characteristics and multipliers
3. **Shared Work Distribution**: Allocate shared platform development work across multiple vehicle applications
4. **Application Sequencing**: Track which application is 1st, 2nd, 3rd, etc. for each platform to enable efficiency curves
5. **Resource Calculation**: Combine base resources × platform multipliers × efficiency multipliers

### Platform-Application Relationship
- **Platform Work**: Shared development work that benefits all applications of a platform
- **Application Work**: Vehicle-specific customization (calibrations, branding, testing)
- **Efficiency Curves**: Learning curve effects where subsequent applications require fewer resources
- **Platform Multipliers**: Platform-specific factors that influence application work complexity

### Calculation Logic
```
Total Resource = (Platform Work / Number of Applications) + 
                (Application Work × Platform Multiplier × Efficiency Multiplier)

Where:
- Platform Work: Shared development allocated across all applications
- Application Work: Base application work from resource curves
- Platform Multiplier: Platform-specific complexity factor
- Efficiency Multiplier: Learning curve factor (100%, 80%, 65%...)
```

### Technical Requirements
- **Timeline Accuracy**: Calculate development timelines within ±1 week accuracy
- **Platform Support**: Handle up to 10 different platforms simultaneously
- **Application Tracking**: Support up to 30 vehicle programs per platform
- **Performance**: Complete calculations for all programs in under 3 seconds
- **Validation**: Detect and flag invalid platform/application configurations

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
|-----------|----------------|----------------|------------------|
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