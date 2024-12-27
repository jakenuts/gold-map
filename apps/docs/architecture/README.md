# Gold Map Architecture

## System Overview

Gold Map uses a modular, microservices-based architecture to collect, process, and serve geospatial data from various sources. The system is built with TypeScript and follows modern development practices.

## Component Architecture

```mermaid
graph TB
    subgraph Frontend
        MA[Map Application]
        AA[Admin Application]
    end

    subgraph Services
        TR[Task Runner]
        API[API Gateway]
    end

    subgraph Data Sources
        USGS[USGS MRDS]
        BLM[BLM Claims]
    end

    subgraph Storage
        PG[(PostgreSQL)]
        RD[(Redis)]
    end

    MA --> API
    AA --> API
    API --> PG
    TR --> PG
    TR --> RD
    TR --> USGS
    TR --> BLM
```

## Data Flow

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant TR as Task Runner
    participant DS as Data Source
    participant Q as Queue
    participant DB as PostgreSQL
    participant API as API Gateway
    participant UI as User Interface

    S->>TR: Schedule Data Collection
    TR->>DS: Fetch Data
    DS-->>TR: Raw Data
    TR->>Q: Queue Processing Job
    Q->>TR: Process Data
    TR->>DB: Store Processed Data
    UI->>API: Request Data
    API->>DB: Query Data
    DB-->>API: Return Results
    API-->>UI: Display Results
```

## Component Details

### Frontend Applications

1. Map Application
   - Public-facing web map
   - Interactive data visualization
   - Data filtering and search

2. Admin Application
   - Job management
   - System monitoring
   - Configuration management

### Backend Services

1. Task Runner
   - Job scheduling
   - Data collection
   - Data processing
   - Queue management

2. API Gateway
   - Data access
   - Authentication
   - Rate limiting
   - Caching

## Data Processing Pipeline

```mermaid
flowchart LR
    subgraph Collection
        F[Fetch Data]
        V[Validate]
        T[Transform]
    end

    subgraph Processing
        P[Process]
        E[Enrich]
        I[Index]
    end

    subgraph Storage
        S[(Store)]
        C[Cache]
    end

    F --> V
    V --> T
    T --> P
    P --> E
    E --> I
    I --> S
    S --> C
```

## Integration Points

### External Services

```mermaid
graph LR
    subgraph Gold Map
        TR[Task Runner]
        API[API Gateway]
    end

    subgraph External APIs
        USGS[USGS MRDS API]
        BLM[BLM Claims API]
        GEO[Geocoding Service]
    end

    TR --> USGS
    TR --> BLM
    API --> GEO
```

### Internal Communication

```mermaid
graph TB
    subgraph Frontend
        MA[Map App]
        AA[Admin App]
    end

    subgraph Backend
        API[API Gateway]
        TR[Task Runner]
        Q[Queue]
    end

    subgraph Storage
        PG[(PostgreSQL)]
        RD[(Redis)]
    end

    MA --> API
    AA --> API
    API --> PG
    TR --> Q
    Q --> RD
    TR --> PG
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Production
        LB[Load Balancer]
        API1[API Instance 1]
        API2[API Instance 2]
        TR1[Task Runner 1]
        TR2[Task Runner 2]
    end

    subgraph Data
        PG_M[(PostgreSQL Master)]
        PG_R[(PostgreSQL Replica)]
        RD_M[(Redis Master)]
        RD_R[(Redis Replica)]
    end

    LB --> API1
    LB --> API2
    API1 --> PG_M
    API2 --> PG_M
    TR1 --> RD_M
    TR2 --> RD_M
    PG_M --> PG_R
    RD_M --> RD_R
```

## Security Architecture

```mermaid
graph TB
    subgraph Public
        UI[User Interface]
    end

    subgraph DMZ
        LB[Load Balancer]
        WAF[Web Application Firewall]
    end

    subgraph Private
        API[API Gateway]
        AUTH[Authentication]
        TR[Task Runner]
    end

    subgraph Data
        DB[(Database)]
        CACHE[(Cache)]
    end

    UI --> WAF
    WAF --> LB
    LB --> API
    API --> AUTH
    API --> DB
    TR --> CACHE
    TR --> DB
```

## Configuration Management

The system uses a hierarchical configuration system:

1. Environment Variables
2. Configuration Files
3. Database Settings
4. Runtime Configuration

See [Configuration Guide](../operations/configuration.md) for details.

## Monitoring & Logging

The system implements comprehensive monitoring:

1. Application Metrics
2. System Health
3. Job Status
4. Error Tracking

See [Monitoring Guide](../operations/monitoring.md) for details.

## Scaling Considerations

The architecture supports horizontal scaling through:

1. Stateless Services
2. Queue-based Processing
3. Read Replicas
4. Caching Layers

See [Scaling Guide](../operations/scaling.md) for details.
