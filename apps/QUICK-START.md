# Gold Map Quick Start Guide

## Overview

Gold Map is a comprehensive platform for collecting, managing, and visualizing geospatial data related to mining claims and mineral resources. This guide will help you get started with development.

## Prerequisites

- Node.js >= 18
- pnpm >= 8.9.0
- Docker & Docker Compose
- Git

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gold-map.git
   cd gold-map
   ```

2. Set up the project
   ```bash
   # Install dependencies and build packages
   pnpm setup
   ```

3. Configure environment
   ```bash
   # Copy environment files
   cp .env.example .env
   cp services/task-runner/.env.example services/task-runner/.env

   # Edit the .env files with your settings
   ```

4. Start the development environment
   ```bash
   # Start infrastructure services
   pnpm docker:up

   # Start development servers
   pnpm dev
   ```

5. Access the applications
   - Map UI: http://localhost:3000
   - Admin UI: http://localhost:3001
   - API Documentation: http://localhost:3002/docs

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

## Common Tasks

### Development

1. Start development servers
   ```bash
   pnpm dev
   ```

2. Run tests
   ```bash
   pnpm test
   ```

3. Format code
   ```bash
   pnpm format
   ```

### Data Collection

1. Schedule USGS MRDS data collection
   ```bash
   curl -X POST http://localhost:3001/api/data-collection/schedule \
     -H "Content-Type: application/json" \
     -d '{
       "type": "FETCH_USGS_MRDS",
       "config": {
         "type": "USGS_MRDS",
         "boundingBox": {
           "minLon": -124.4071825,
           "maxLon": -122.3933314,
           "minLat": 40.0711794,
           "maxLat": 41.7410164
         }
       },
       "cron": "0 0 * * *"
     }'
   ```

2. Check job status
   ```bash
   curl http://localhost:3001/api/queues/data-collection/status
   ```

### Database Management

1. Create migration
   ```bash
   pnpm db:generate AddNewFeature
   ```

2. Run migrations
   ```bash
   pnpm db:migrate
   ```

### Docker Operations

1. View logs
   ```bash
   pnpm docker:logs
   ```

2. Stop services
   ```bash
   pnpm docker:down
   ```

## Documentation

1. View documentation
   ```bash
   pnpm docs:serve
   ```

2. Key documentation files:
   - [Architecture Overview](docs/architecture/README.md)
   - [Data Sources](docs/data-sources/README.md)
   - [Development Guide](docs/development/README.md)
   - [Operations Guide](docs/operations/README.md)

## Troubleshooting

### Common Issues

1. Port conflicts
   - Check if ports 3000-3002 are available
   - Modify port numbers in .env files if needed

2. Database connection issues
   - Verify PostgreSQL is running: `docker compose ps`
   - Check connection settings in .env

3. Build errors
   - Clear dependencies: `pnpm clean`
   - Rebuild: `pnpm build`

### Getting Help

1. Check the documentation in the `docs` directory
2. Review service logs: `pnpm docker:logs`
3. Check the troubleshooting guide: [docs/operations/README.md](docs/operations/README.md#troubleshooting)

## Next Steps

1. Review the [Architecture Documentation](docs/architecture/README.md)
2. Explore the [Development Guide](docs/development/README.md)
3. Set up your IDE using the provided configurations
4. Join the development team chat

## Contributing

See [CONTRIBUTING.md](docs/development/CONTRIBUTING.md) for guidelines on:
- Code style
- Pull request process
- Testing requirements
- Documentation updates
