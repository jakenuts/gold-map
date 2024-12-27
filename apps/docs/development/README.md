# Development Guide

## Project Setup

### Prerequisites
- Node.js >= 18
- pnpm >= 8.9.0
- Docker & Docker Compose
- PostgreSQL with PostGIS
- Redis

### Initial Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gold-map.git
   cd gold-map
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment
   ```bash
   # Copy environment files
   cp .env.example .env
   cp services/task-runner/.env.example services/task-runner/.env

   # Edit environment files as needed
   ```

4. Start development environment
   ```bash
   # Start infrastructure services
   docker compose up -d postgres redis

   # Start development servers
   pnpm dev
   ```

## Project Structure

```
gold-map/
├── apps/                    # Frontend applications
│   ├── admin/              # Admin interface
│   │   ├── src/
│   │   └── package.json
│   └── map/               # Public map interface
│       ├── src/
│       └── package.json
├── packages/               # Shared packages
│   ├── core/              # Core utilities
│   │   ├── src/
│   │   └── package.json
│   └── data-sources/      # Data source clients
│       ├── src/
│       └── package.json
├── services/              # Backend services
│   └── task-runner/       # Job scheduling service
│       ├── src/
│       └── package.json
├── docs/                  # Documentation
├── tools/                 # Development tools
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # Workspace configuration
└── turbo.json           # Turborepo configuration
```

## Development Workflow

### Working with the Monorepo

1. Adding dependencies
   ```bash
   # Add to specific package
   cd packages/core
   pnpm add some-package

   # Add to all packages
   pnpm add -w some-package
   ```

2. Running commands
   ```bash
   # Run in all packages
   pnpm build

   # Run in specific package
   pnpm --filter @gold-map/core build
   ```

3. Creating new package
   ```bash
   mkdir -p packages/new-package
   cd packages/new-package
   pnpm init
   ```

### Development Process

1. Create feature branch
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make changes
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation

3. Test changes
   ```bash
   # Run tests
   pnpm test

   # Run linting
   pnpm lint

   # Build all packages
   pnpm build
   ```

4. Submit pull request
   - Provide clear description
   - Link related issues
   - Include test results

## Testing

### Unit Testing
```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @gold-map/core test

# Run with coverage
pnpm test --coverage
```

### Integration Testing
```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Run integration tests
pnpm test:integration

# Clean up
docker compose -f docker-compose.test.yml down
```

### End-to-End Testing
```bash
# Start full environment
docker compose up -d

# Run E2E tests
pnpm test:e2e

# Clean up
docker compose down
```

## Common Tasks

### Adding a New Data Source

1. Create client package
   ```bash
   cd packages/data-sources
   mkdir src/sources/new-source
   ```

2. Implement client
   ```typescript
   // src/sources/new-source/client.ts
   import { BaseClient } from '../../base/client';

   export class NewSourceClient extends BaseClient {
     // Implementation
   }
   ```

3. Add to factory
   ```typescript
   // src/index.ts
   export function createClient(config: DataSourceConfig) {
     switch (config.type) {
       case 'NEW_SOURCE':
         return new NewSourceClient(config);
     }
   }
   ```

### Updating Database Schema

1. Create migration
   ```bash
   cd services/task-runner
   pnpm typeorm migration:create src/migrations/AddNewTable
   ```

2. Implement migration
   ```typescript
   export class AddNewTable implements MigrationInterface {
     // Implementation
   }
   ```

3. Run migration
   ```bash
   pnpm typeorm migration:run
   ```

## Debugging

### Backend Services
1. Use VSCode launch configurations
2. Check logs: `docker compose logs -f service-name`
3. Use debug endpoints

### Frontend Applications
1. Use browser developer tools
2. Check Redux DevTools
3. Use React Developer Tools

## Performance Optimization

### Database
1. Use EXPLAIN ANALYZE
2. Check index usage
3. Monitor query performance

### API
1. Use response caching
2. Implement pagination
3. Optimize queries

### Frontend
1. Use React.memo
2. Implement virtualization
3. Optimize bundle size

## Deployment

### Production Build
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @gold-map/core build
```

### Docker Deployment
```bash
# Build images
docker compose build

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See [Configuration Guide](../operations/configuration.md) for details.

## Troubleshooting

### Common Issues

1. Build Errors
   - Clear build cache: `pnpm clean`
   - Rebuild: `pnpm build`

2. Database Issues
   - Check connections
   - Verify migrations
   - Check logs

3. API Issues
   - Check rate limits
   - Verify authentication
   - Check logs

## Best Practices

1. Code Style
   - Follow TypeScript guidelines
   - Use ESLint rules
   - Write clear comments

2. Git Workflow
   - Write clear commit messages
   - Keep changes focused
   - Rebase before merging

3. Testing
   - Write unit tests
   - Add integration tests
   - Test edge cases

4. Documentation
   - Update README files
   - Document APIs
   - Add JSDoc comments
