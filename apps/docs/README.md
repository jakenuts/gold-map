# Gold Map Documentation

## Overview

Gold Map is a comprehensive platform for collecting, managing, and visualizing geospatial data related to mining claims and mineral resources. This documentation provides detailed information about the system architecture, components, and usage.

## Documentation Structure

1. [Architecture](./architecture/README.md)
   - System Overview
   - Component Diagrams
   - Data Flow
   - Integration Points

2. [Data Sources](./data-sources/README.md)
   - USGS MRDS
   - BLM Mining Claims
   - Data Schemas
   - API Endpoints

3. [Development](./development/README.md)
   - Setup Guide
   - Development Workflow
   - Testing Guide
   - Deployment Guide

4. [Operations](./operations/README.md)
   - Configuration
   - Monitoring
   - Maintenance
   - Troubleshooting

## Quick Start

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Configure environment: Copy `.env.example` to `.env`
4. Start development: `pnpm dev`

## Project Structure

```
gold-map/
├── apps/                    # Frontend applications
│   ├── admin/              # Admin interface
│   └── map/               # Public map interface
├── packages/               # Shared packages
│   ├── core/              # Core utilities
│   └── data-sources/      # Data source clients
├── services/              # Backend services
│   └── task-runner/       # Job scheduling service
└── docs/                  # Documentation
```

## Contributing

See [CONTRIBUTING.md](./development/CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
