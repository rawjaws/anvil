# [Enabler Name]

## Metadata
- **Name**: [Enabler Name]
- **Type**: Enabler
- **ID**: ENB-XXXXXX
- **Capability ID**: CAP-XXXXXX (Parent Capability)
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: High
- **Analysis Review**: Required
- **Code Review**: Not Required
- **Owner**: Product Team
- **Developer**: [Development Team/Lead]
- **Created Date**: YYYY-MM-DD
- **Last Updated**: YYYY-MM-DD
- **Version**: X.Y

## Technical Overview
### Purpose
[What is the purpose?]

## Functional Requirements

| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|

## Non-Functional Requirements

| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|


# Technical Specifications


## API Technical Specifications (if applicable)

| API Type | Operation | Channel / Endpoint | Description | Request / Publish Payload | Response / Subscribe Data |
|----------|-----------|---------------------|-------------|----------------------------|----------------------------|
| **REST** | GET | `/api/v1/resource` | Get resource | N/A | Resource object |
| REST | POST | `/api/v1/resource` | Create resource | Resource data | Created resource |
| REST | PUT | `/api/v1/resource/{id}` | Update resource | Updated data | Updated resource |
| REST | DELETE | `/api/v1/resource/{id}` | Delete resource | N/A | Success/Error message |
| **MQTT** | PUBLISH | `topic/resource/create` | Create resource event | Resource data JSON | N/A |
| MQTT | SUBSCRIBE | `topic/resource/updates` | Receive updates when resource changes | N/A | Resource object JSON |
| **DDS** | WRITE | `ResourceTopic` | Publish new/updated resource | Resource data struct | N/A |
| DDS | READ / SUBSCRIBE | `ResourceTopic` | Receive resource updates | N/A | Resource data struct |
| **Database (SQL)** | SELECT | `SELECT * FROM resource WHERE id=?` | Query resource | ID parameter | Resource row |
| Database (SQL) | INSERT | `INSERT INTO resource (...) VALUES (...)` | Insert new resource | Resource data | Insert confirmation / Row ID |
| Database (SQL) | UPDATE | `UPDATE resource SET ... WHERE id=?` | Update resource | Updated data | Updated row / Count |
| Database (SQL) | DELETE | `DELETE FROM resource WHERE id=?` | Delete resource | ID parameter | Success/Error |

## Technical Drawings

## Enabler Dependency Flow Diagram
> **Note for AI**: When designing this section, show the direct relationships and dependencies between enablers. Focus on enabler-to-enabler interactions, data flows, execution order, and how they work together. Include:
> - **Same Capability**: Enablers within this capability and their interactions
> - **Internal Dependencies**: Dependencies between enablers within the same organizational boundary/domain
> - **External Dependencies**: Dependencies across organizational boundaries to external capabilities
> - **Direct External Systems**: Include external systems/services that enablers directly interact with (APIs, databases, message queues)
> - **Exclude**: Indirect dependencies, infrastructure components that don't directly interact with enablers

```mermaid
flowchart TD
    %% Current Capability Enablers
    ENB001["ENB-001<br/>Primary Enabler"]
    ENB002["ENB-002<br/>Data Processor"]
    ENB003["ENB-003<br/>Configuration"]
    
    %% Internal Capability Enablers (Same Organization)
    ENB201["ENB-201<br/>Auth Service"]
    ENB202["ENB-202<br/>Data Storage"]
    ENB203["ENB-203<br/>Notification"]
    
    %% External Capability Enablers (Different Organization)
    ENB101["ENB-101<br/>External Enabler A"]
    ENB102["ENB-102<br/>External Enabler B"]
    
    %% Internal Dependencies Flow
    ENB201 --> ENB002
    ENB002 --> ENB001
    ENB003 --> ENB001
    ENB001 --> ENB202
    ENB202 --> ENB203
    
    %% External Dependencies Flow
    ENB101 --> ENB002
    ENB001 --> ENB102
    
    %% Styling
    classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef internal fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef config fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class ENB001,ENB002 current
    class ENB201,ENB202,ENB203 internal
    class ENB101,ENB102 external
    class ENB003 config
    
    %% Capability Grouping
    subgraph CAP001 ["Current Capability"]
        ENB001
        ENB002
        ENB003
    end
    
    subgraph CAP003 ["Internal Capability"]
        ENB201
        ENB202
        ENB203
    end
    
    subgraph CAP002 ["External Capability"]
        ENB101
        ENB102
    end
```

### Data Models
```mermaid
erDiagram
    Entity {
        string id PK
        string name
        string identifier UK
        datetime created_at
        datetime updated_at
    }
    EntityProfile {
        string entity_id PK,FK
        string description
        string metadata_url
        json configuration
    }
    Request {
        string id PK
        string entity_id FK
        decimal value
        string status
        datetime request_date
    }
    RequestItem {
        string id PK
        string request_id FK
        string component_id FK
        int quantity
        decimal unit_cost
    }
    Component {
        string id PK
        string name
        decimal cost
        int available_quantity
        string type
    }
    ComponentType {
        string id PK
        string name
        string description
    }
    Label {
        string id PK
        string name
        string color
    }
    ComponentLabel {
        string component_id PK,FK
        string label_id PK,FK
        datetime assigned_at
    }
    
    %% All 7 Mermaid ER Relationship Types:
    Entity ||--|| EntityProfile : "one-to-one"
    Entity ||--o{ Request : "one-to-zero-or-many"
    Request ||--|{ RequestItem : "one-to-one-or-many"
    RequestItem }|--|| Component : "many-to-one"
    Component }o--|| ComponentType : "zero-or-many-to-one"
    Component }|--|{ Label : "many-to-many (via junction)"
    Entity }o--o{ Component : "zero-or-many-to-zero-or-many"
```

### Class Diagrams
```mermaid
classDiagram
    %% Abstract Base Class
    class BaseEntity {
        <<abstract>>
        +String id
        +DateTime createdAt
        +DateTime updatedAt
        +validate()* bool
        +save() bool
        +delete() bool
    }
    
    %% Interface
    class IProcessor {
        <<interface>>
        +processRequest(data, options)* Result
        +validateRequest(requestId)* ValidationResult
        +getStatus(requestId)* Status
    }
    
    %% Concrete Classes
    class Entity {
        -String identifier
        -String name
        #String type
        +authenticate(credentials) bool
        +updateData(data) bool
        +getRelatedItems() List~Item~
    }
    
    class Item {
        -String entityId
        -Decimal value
        -ItemStatus status
        -List~Component~ components
        +addComponent(component, quantity) void
        +removeComponent(componentId) void
        +calculateTotal() Decimal
        +processItem() bool
    }
    
    class Component {
        +String name
        +Decimal cost
        +Integer quantity
        +String category
        +updateQuantity(amount) bool
        +isAvailable() bool
    }
    
    class Service {
        -String configKey
        -String environment
        +processItem(item) Result
        +handleCallback(data) void
    }
    
    %% Enumeration
    class ItemStatus {
        <<enumeration>>
        PENDING
        ACTIVE
        PROCESSING
        COMPLETED
        CANCELLED
    }
    
    %% Relationships with multiplicities and labels
    BaseEntity <|-- Entity : inherits
    BaseEntity <|-- Item : inherits  
    BaseEntity <|-- Component : inherits
    IProcessor <|.. Service : implements
    Entity "1" --> "0..*" Item : manages
    Item "1" --> "1..*" Component : contains
    Item *-- ItemStatus : "has status"
    Service ..> Item : processes
    Entity --> Component : accesses
    
    %% Notes
    note for Entity "Entities must be validated\nbefore processing items"
    note for Service "Configurable service\nfor item processing"
```
### Sequence Diagrams
```mermaid
sequenceDiagram
    participant User
    participant API
    participant Service
    participant Database
    
    User->>API: Request
    API->>Service: Process Request
    Service->>Database: Query/Update
    Database-->>Service: Result
    Service-->>API: Response
    API-->>User: Final Response
```

### Dataflow Diagrams
```mermaid
flowchart TD
    %% External Entities
    ExternalActor([External Actor])
    ExternalService([External Service])
    NotificationSystem([Notification System])
    
    %% Processes
    ProcessRequest{Process Request}
    ValidateData{Validate Data}
    UpdateStorage{Update Storage}
    SendResponse{Send Response}
    
    %% Data Stores
    PrimaryDB[(Primary Database)]
    SecondaryDB[(Secondary Database)]  
    ConfigDB[(Configuration Store)]
    AuditDB[(Audit Logs)]
    
    %% Data Flows with Labels
    ExternalActor -->|Initial Request| ProcessRequest
    ProcessRequest -->|Data Query| PrimaryDB
    PrimaryDB -->|Retrieved Data| ProcessRequest
    
    ProcessRequest -->|Validation Request| ValidateData
    ValidateData -->|External Validation| ExternalService
    ExternalService -->|Validation Result| ValidateData
    
    ValidateData -->|Processed Data| UpdateStorage
    UpdateStorage -->|Storage Query| SecondaryDB
    SecondaryDB -->|Current State| UpdateStorage
    UpdateStorage -->|Updated State| SecondaryDB
    
    ValidateData -->|Confirmed Data| ConfigDB
    ProcessRequest -->|Status Update| SendResponse
    SendResponse -->|Notification Request| NotificationSystem
    
    %% Audit Trail
    ProcessRequest -->|Activity Log| AuditDB
    ValidateData -->|Validation Log| AuditDB
    UpdateStorage -->|Change Log| AuditDB
    
    %% Return Flows
    SendResponse -->|Response| ExternalActor
    
    %% Styling
    classDef external fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef datastore fill:#e8f5e8
    
    class ExternalActor,ExternalService,NotificationSystem external
    class ProcessRequest,ValidateData,UpdateStorage,SendResponse process
    class PrimaryDB,SecondaryDB,ConfigDB,AuditDB datastore
```

### State Diagrams
```mermaid
stateDiagram-v2
    %% Enabler Lifecycle State Machine
    [*] --> ReadyforAnalysis : Initialize Enabler
    
    ReadyforAnalysis --> InAnalysis : Begin Analysis
    ReadyforAnalysis --> Retired : Cancel Early
    
    InAnalysis --> ReadyforAnalysisReview : Analysis Complete
    InAnalysis --> ReadyforAnalysis : Return to Analysis
    
    ReadyforAnalysisReview --> InAnalysisReview : Begin Review
    ReadyforAnalysisReview --> InAnalysis : Return to Analysis
    
    InAnalysisReview --> ReadyforDesign : Analysis Approved
    InAnalysisReview --> InAnalysis : Analysis Rejected
    
    ReadyforDesign --> InDesign : Begin Design
    ReadyforDesign --> ReadyforAnalysis : Return to Analysis
    
    InDesign --> ReadyforDesignReview : Design Complete
    InDesign --> ReadyforDesign : Return to Design
    
    ReadyforDesignReview --> InDesignReview : Begin Review
    ReadyforDesignReview --> InDesign : Return to Design
    
    InDesignReview --> ReadyforImplementation : Design Approved
    InDesignReview --> InDesign : Design Rejected
    
    ReadyforImplementation --> InImplementation : Begin Implementation
    ReadyforImplementation --> ReadyforDesign : Return to Design
    
    InImplementation --> Implemented : Implementation Complete
    InImplementation --> ReadyforImplementation : Implementation Issues
    
    Implemented --> ReadyforRefactor : Refactoring Needed
    Implemented --> ReadyforRetirement : End of Life
    
    ReadyforRefactor --> InRefactor : Begin Refactor
    ReadyforRefactor --> Implemented : No Refactor Needed
    
    InRefactor --> Implemented : Refactor Complete
    InRefactor --> ReadyforRefactor : Refactor Issues
    
    ReadyforRetirement --> InRetirement : Begin Retirement Process
    ReadyforRetirement --> Implemented : Continue Usage
    
    InRetirement --> Retired : Retirement Complete
    InRetirement --> ReadyforRetirement : Retirement Issues
    
    Retired --> [*]
    
    %% Notes
    note right of InAnalysisReview : Review requirements\nand feasibility
    note right of InDesignReview : Review technical\ndesign and architecture
    note right of InImplementation : Active development\nand testing
```


## Dependencies
### Internal Dependencies
- [Service/Component 1]: [Why needed]
- [Service/Component 2]: [Why needed]

### External Dependencies
- [Third-party service 1]: [Integration details]
- [Third-party service 2]: [Integration details]

---

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
| Parent Capability Approval | "Approved" | Continue to next condition check |1. Stop all processing 2. Respond with "Parent Capability is not approved. Both Parent Capability and Enabler status must be 'Approved' to proceed."  |
| Enabler Approval | "Approved" | Continue to next task | Stop all processing, Respond with "Enabler is not approved. Both Parent Capability and Enabler status must be 'Approved' to proceed." |

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
**Purpose**: Analyze the current enabler and determine what new requirements or modifications need to be made.

### Pre-Conditions Verification
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|----------------|-----------------|
| Task 1 Completion | Must be "Passed" | Continue to next condition check | STOP - explain why you are stopping |
| Enabler Status | "Ready for Analysis" | Continue to Analysis Process Section | SKIP to Task 3: Design |

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
| 2 | Set Enabler Status | "In Analysis" |
| 3 | Generate new requirements | Analyze the Enabler and create new requirements |
| 4 | Configure requirements | Apply Requirement Configuration rules below |

### Requirement Configuration Rules
| Enabler Analysis Review Setting | Requirement Approval | Requirement Status | Requirement Priority |
|------------------------|---------------------|-------------------|-------------------|
| "Required" | "Pending" | "Ready for Design" | "Must Have" or "Should Have" or "Could Have" or "Won't Have" |
| "Not Required" | "Approved" | "Ready for Design" | "Must Have" or "Should Have" or "Could Have" or "Won't Have" |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Ready for Design"

### Exit Criteria Checklist
- [ ] All new requirements added to Enabler
- [ ] All requirements have appropriate Approval and Status set following the Requirement Configuration Rules

### Critical Rules
- Do NOT modify existing requirements
- Create copies as new requirements if improvements needed
- ONLY explicitly obtained user approval can change Approval to "Approved"

---

## Task 3: Design
**Purpose**: Create a design based only on approved and ready to implement requirements by following the sections below.

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Enabler Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Enabler Status | "Ready for Design" | continue to next section | SKIP to Task 4: Implementation |

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
| 2 | Set Enabler Status | "In Design" |
| 3 | Display the requirements you are using in the design. Following the Requirements State Processing below and only Requirements in Approval = "Approved" | only Requirements in Approval = "Approved" |
| 4 | Do the design by updating the Technical Specification documenting and updating All applicable sections using only the Requirements outlined in the Requirements State Processing below and only Requirements in Approval = "Approved" | only Requirements in Approval = "Approved" |

### Requirements State Processing
| Requirement State | Action |
|------------------|--------|
| "In Draft" | Do NOT include in design |
| "Ready for Design" | Include in design |
| "Ready for Implementation" | Include in design |
| "Ready for Refactor" | Include in design |
| "Ready for Retirement" | Remove from design completely |

### Documentation Requirements
| Section | Content | If Not Applicable |
|---------|---------|-------------------|
| Technical Specifications | Main design | Required |
| Dependency Flow Diagrams | Flow diagrams | Mark "Not Applicable" if not applicable |
| API Technical Specifications | JSON structures, configs | Mark "Not Applicable" if not applicable |
| Data Models | Data structures | Mark "Not Applicable" if not applicable |
| Sequence Diagrams | Process flows | Mark "Not Applicable" if not applicable |
| Class Diagrams | Class structures | Mark "Not Applicable" if not applicable |
| Data Flow Diagrams | Data movement | Mark "Not Applicable" if not applicable |
| State Diagrams | State transitions | Mark "Not Applicable" if not applicable |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Ready for Implementation"
| 2 | Set Each Requirement in State  "Ready for Implementation"

### Absolute Prohibitions (ZERO TOLERANCE)
- 🚫 Never bypass for any reason whatsoever
- 🚫 Never write implementation code during this task
- 🚫 Never used unapproved or not ready to implement requirements in design

---

## Task 4: Implementation
**Purpose**: Execute requirement implementation only if approved.

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Enabler Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Enabler Status | "Ready for Implementation" | continue to next section | SKIP to Task 5: Refactor |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed


### Implement
| Step | Action | Requirement |
|------|--------|-------------|
| 1 | Implement each requirement following the requirement rules below | Requirement Appproval = "Approved" |

### Requirement Rules
| Requirement State | Action | Final Requirement Status |
|------------------|--------|--------------|
| Requirement Status = "Ready for Implementation" | Implement the new requirement | "Implemented" |

### Post-Condition Transition Checklist
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Implemented" |
| 2 | Update ALL Functional Requirements Status to "Implemented" |
| 3 | Update ALL Non-Functional Requirements Status to "Implemented" |
| 4 | Verify all requirements are marked "Implemented" |
  
### Exit Criteria Checklist
- [ ] Implementation completed for all approved requirements
  - [ ] ALL Functional Requirements Status = "Implemented"
  - [ ] ALL Non-Functional Requirements Status = "Implemented"
  - [ ] Enabler Status = "Implemented"

**CRITICAL REMINDER**: After implementing code, you MUST update the status of ALL requirements that were implemented. This is not optional - it's a mandatory part of the implementation task.

---

## Task 5: Refactor
**Purpose**: Refactor the design and code based on specification and requirement changes.

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Enabler Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Enabler Status | "Ready for Refactor" | continue to next section | SKIP to Task 6: Retire |

#### Critical Rules
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Refactor Process
| Step | Action | Target State |
|------|--------|-------------|
| 1 | Verify pre-conditions | All must pass |
| 2 | Set Enabler State | "In Refactor" |
| 3 | Update **technical specifications** and code for all Requirements in Approval = "Approved" and State = "Ready for Refactor" | Requirement State = "Implemented" |
| 4 | Update **code** for all Requirements in Approval = "Approved" and State = "Ready for Refactor" | Requirement State = "Implemented" |
| 5 | Remove **technical specifications** for all Requirements in Approval = "Approved" and in State = "Ready for Retirement" |
| 6 | Remove **technical specifications** and code for all Requirements in Approval = "Approved" and in State = "Ready for Retirement" |
| 7 | Set Requirement State | "Retired" |

#### Critical Rules
- **DO NOT REMOVE REQUIREMENT FROM ENABLER**: Do not remove the requirement from the Enabler requirements list.

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Implemented"

---

## Task 6: Retire
**Purpose**: Completely remove enabler from codebase.

### Pre-Conditions Verification (ABSOLUTELY MANDATORY)
| Condition | Required Value | Action if True | Action if False |
|-----------|----------------|---------|----------------------|
| Enabler Approval | "Approved" | continue to next pre-condition check | IMMEDIATE STOP |
| Enabler Status | "Ready for Retirement" | continue to next section | IMMEDIATE STOP |

#### Critical Rules
- **DO NOT REMOVE REQUIREMENT FROM ENABLER**: Do not remove the **Enabler** from the **Capability** Enablers list.
- **ABSOLUTE PROHIBITION**: Never ask user to change Pre-Conditions values
- **IMMEDIATE TERMINATION**: Stop ALL processing if pre-conditions fail
- **NO EXCEPTIONS**: Pre-condition failures = MANDATORY STOP
- **WORKFLOW HALT**: Do not proceed past failed pre-condition verification
- **RESPONSE REQUIREMENT**: Must explicitly state "STOPPING due to failed pre-conditions" and explain which conditions failed

### Retirement Process
| Step | Action | Result |
|------|--------|--------|
| 1 | Verify pre-conditions | All must pass |
| 2 | Set Enabler State | "In Retirement" |
| 3 | Remove Enabler from parent specifications | Clean parent capability |
| 4 | Remove all enabler code | Complete removal |
| 5 | Mark requirements | All set to "Retired" |

### Post-Condition Transition
| Step | Action |
|------|--------|
| 1 | Set Enabler Status "Retired"

### Exit Criteria Checklist
- [ ] All code removed from codebase
- [ ] Parent capability updated
- [ ] All requirements marked "Retired"
- [ ] Enabler State set to "Retired"

---

## Universal Rules

### Critical Prohibitions (Apply to All Tasks)
| Rule | Description | Consequence |
|------|-------------|-------------|
| Never modify pre-conditions | Pre-condition values must already be correct | IMMEDIATE TASK FAILURE |
| Zero tolerance for unapproved requirements | Never implement/design without approval | IMMEDIATE STOP |
| No bypassing for any reason | Never bypass for "testing", "demo", etc. | PERMANENT PROHIBITION |

### Response Format Requirements
| Task | Must Include |
|------|-------------|
| All | Pre-condition verification status |
| All | Clear proceed/stop decision |
| All | Explanation if stopping |
| Analysis | List of new requirements created |
| Design | List of design elements documented |
| Implementation | List of implemented requirements |

## Notes
[Any additional context, assumptions, or open questions]