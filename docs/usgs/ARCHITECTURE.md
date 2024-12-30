# Gold Map System Architecture

## System Overview

The Gold Map system is a comprehensive data aggregation and visualization platform designed to collect, process, and serve geospatial data from various sources. The system follows a modular, microservices-based architecture with TypeScript throughout the stack.

## Core Components

### 1. Core Package (@gold-map/core)
Location: `packages/core/`
Purpose: Shared types, interfaces, and utilities used across the system.

Key Features:
- Geospatial data types (GeoJSON compatible)
- Job and queue management interfaces
- Configuration types
- Shared utilities

### 2. Data Sources Package (@gold-map/data-sources)
Location: `packages/data-sources/`
Purpose: Data source clients and transformers.

Implemented Sources:
- USGS Mineral Resources Data System (MRDS)
- Bureau of Land Management (BLM) Mining Claims

Each source implements:
- Data fetching with retry logic
- Rate limiting
- Error handling
- Data transformation to common format

### 3. Task Runner Service
Location: `services/task-runner/`
Purpose: Job scheduling and execution management.

Features:
- Job scheduling with cron expressions
- Queue management
- REST API for control
- Status monitoring
- Error handling and logging

## Data Flow


1. Data Collection:
   ```
   Source API → Data Source Client → Queue → Storage
   ```

2. Data Processing:
   ```
   Storage → Processing Queue → Transformed Data → Storage
   ```

3. Data Serving:
   ```
   Client Request → API → Storage → Response
   ```

## Implementation Plan

### Phase 1: Infrastructure Setup (1 week)

1. Environment Setup
   - [ ] Set up development environment
   - [ ] Configure Docker and Docker Compose
   - [ ] Set up PostgreSQL with PostGIS
   - [ ] Configure Redis for queues

Validation:
- Verify Docker containers start correctly
- Check database connections
- Validate Redis connectivity
- Test environment variable loading

### Phase 2: Core Implementation (1 week)

1. Core Package
   - [ ] Implement geospatial types
   - [ ] Create shared interfaces
   - [ ] Add utility functions
   - [ ] Set up build process

2. Data Sources Package
   - [ ] Implement base client
   - [ ] Add USGS MRDS client
   - [ ] Add BLM Claims client
   - [ ] Create data transformers

Validation:
- Test each data source client individually
- Verify data transformation accuracy
- Check error handling
- Validate rate limiting

### Phase 3: Task Runner Service (1 week)

1. Queue Setup
   - [ ] Configure Bull queues
   - [ ] Implement job processors
   - [ ] Add error handling
   - [ ] Set up monitoring

2. API Implementation
   - [ ] Create REST endpoints
   - [ ] Add job management
   - [ ] Implement scheduling
   - [ ] Add status monitoring

Validation:
- Test queue operations
- Verify job scheduling
- Check error recovery
- Validate API endpoints

### Phase 4: Integration (1 week)

1. System Integration
   - [ ] Connect all components
   - [ ] Set up data flow
   - [ ] Configure logging
   - [ ] Add monitoring

2. Documentation
   - [ ] API documentation
   - [ ] Setup guides
   - [ ] Configuration docs
   - [ ] Examples

## Validation Guide

### Component Testing

1. Data Source Clients
   ```bash
   # Test USGS MRDS client
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

   # Verify in database
   psql -d goldmap -c "SELECT COUNT(*) FROM geo_features WHERE source = 'USGS_MRDS'"
   ```

2. Queue Management
   ```bash
   # Check queue status
   curl http://localhost:3001/api/queues/data-collection/status

   # Monitor logs
   docker compose logs -f task-runner
   ```

3. Data Processing
   ```bash
   # Schedule processing job
   curl -X POST http://localhost:3001/api/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "queueName": "data-processing",
       "type": "PROCESS_GEOJSON",
       "data": {
         "sourceType": "USGS_MRDS"
       }
     }'

   # Verify results
   psql -d goldmap -c "SELECT COUNT(*) FROM processed_features"
   ```

### Integration Testing

1. Full Data Pipeline Test
   ```bash
   # 1. Schedule data collection
   # 2. Monitor job progress
   # 3. Verify data in database
   # 4. Check processed results
   # 5. Validate API responses
   ```

2. Error Recovery Test
   ```bash
   # 1. Stop Redis during job
   # 2. Verify job recovery
   # 3. Check data consistency
   ```

3. Load Testing
   ```bash
   # 1. Schedule multiple jobs
   # 2. Monitor system performance
   # 3. Check resource usage
   ```

## Common Issues & Solutions

1. Rate Limiting
   - Issue: API rate limits exceeded
   - Solution: Adjust `RATE_LIMIT_PER_SECOND` in config

2. Data Processing
   - Issue: Memory usage spikes
   - Solution: Adjust `BATCH_SIZE` in processing jobs

3. Job Scheduling
   - Issue: Jobs not running on schedule
   - Solution: Check timezone settings and cron expressions

## Monitoring & Maintenance

1. System Health
   - Monitor `/health` endpoint
   - Check Redis queue sizes
   - Monitor PostgreSQL connections

2. Data Quality
   - Verify feature counts
   - Check coordinate ranges
   - Validate property completeness

3. Performance
   - Monitor job execution times
   - Check database query performance
   - Monitor API response times

## Next Steps

1. Admin Interface
   - Job management UI
   - System monitoring dashboard
   - Configuration management

2. Data Visualization
   - Interactive map interface
   - Data filtering and search
   - Export capabilities

3. Authentication & Authorization
   - User management
   - API key system
   - Role-based access control

## Development Workflow

1. Feature Development
   - Create feature branch
   - Implement changes
   - Test thoroughly
   - Submit pull request

2. Testing Process
   - Test individual components
   - Verify integration points
   - Check error handling
   - Validate through UI/API

3. Deployment
   - Update documentation
   - Tag release
   - Deploy with Docker
   - Monitor rollout

## Support & Resources

1. Documentation
   - API documentation in `docs/api.md`
   - Configuration guide in `docs/config.md`
   - Troubleshooting in `docs/troubleshooting.md`

2. Tools
   - Postman collection in `tools/postman/`
   - Example scripts in `tools/scripts/`
   - Docker utilities in `tools/docker/`

Remember to always test changes through the entire pipeline and verify the results in the UI or through API responses. Integration testing is crucial for ensuring system reliability.
