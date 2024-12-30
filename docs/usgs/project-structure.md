# Gold Map Platform

## Project Structure

```
gold-map/
├── apps/                      # Application frontends
│   ├── admin-ui/             # Management interface
│   └── map-ui/              # Public mapping interface
├── packages/                  # Shared packages
│   ├── core/                 # Core utilities and types
│   ├── data-sources/         # Data source integrations
│   ├── geo-utils/            # Geospatial utilities
│   └── ui-components/        # Shared UI components
├── services/                  # Backend services
│   ├── api/                  # GraphQL/REST API service
│   ├── data-collector/       # Data collection service
│   └── task-runner/          # Job scheduling service
└── tools/                    # Development tools
    ├── scripts/              # Build and maintenance scripts
    └── testing/              # Test utilities

## Key Features

### Core Infrastructure
- TypeScript monorepo using pnpm workspaces
- NestJS for backend services
- React + Vite for frontends
- Bull for job queues
- PostgreSQL + PostGIS for storage
- Redis for caching

### Data Collection
- Automated data source updates
- Configurable schedules
- Progress monitoring
- Error handling and retries

### API Layer
- GraphQL for flexible queries
- REST endpoints for simple access
- Real-time updates
- Rate limiting and caching

### Management UI
- Data source configuration
- Job monitoring
- System health dashboard
- User management

### Map UI
- Interactive map visualization
- Data filtering and search
- Layer management
- Export capabilities

## Development Workflow

1. Install dependencies:
```bash
pnpm install
```

2. Start development environment:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

## Documentation Structure

1. `/docs`
   - Architecture Overview
   - API Documentation
   - Data Sources
   - Development Guide
   - Deployment Guide

2. Package READMEs
   - Installation
   - Usage Examples
   - API Reference
   - Testing Guide

## Next Steps

1. Set up monorepo structure
2. Migrate existing code
3. Implement shared packages
4. Create unified build process
5. Set up CI/CD pipeline
