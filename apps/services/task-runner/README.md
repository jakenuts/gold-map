# Task Runner Service

A service for scheduling and managing data collection and processing tasks. It provides a REST API for job management and uses Bull queues for reliable job processing.

## Features

- Automated data collection from multiple sources (USGS MRDS, BLM Claims)
- Scheduled job execution using cron expressions
- Job status monitoring and management
- Automatic retries and error handling
- REST API for job control
- Redis-backed job queues

## Prerequisites

- Node.js >= 18
- Redis server
- PostgreSQL with PostGIS extension

## Configuration

Configuration is handled through environment variables:

```env
# Server
PORT=3001
HOST=localhost

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=goldmap
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password

# Logging
LOG_LEVEL=info
```

## Installation & Running

### Local Development

```bash
# Install dependencies
pnpm install

# Build the service
pnpm build

# Start in development mode
pnpm dev

# Start in production mode
pnpm start
```

### Using Docker

The service can be run using Docker Compose, which will set up all required dependencies:

```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env

# Start the services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure as needed
3. Run `docker compose up -d`
4. Access the API at `http://localhost:3001`

Example: Schedule USGS MRDS data collection
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

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Queue Status
```
GET /api/queues/:name/status
Response: {
  "active": number,
  "waiting": number,
  "completed": number,
  "failed": number
}
```

### Add Job
```
POST /api/jobs
Body: {
  "queueName": string,
  "type": string,
  "data": object,
  "options": object
}
Response: { "jobId": string }
```

### Schedule Job
```
POST /api/schedules
Body: {
  "queueName": string,
  "jobType": string,
  "data": object,
  "cron": string,
  "enabled": boolean,
  "description": string
}
Response: { "message": "Job scheduled successfully" }
```

### Schedule Data Collection
```
POST /api/data-collection/schedule
Body: {
  "type": "FETCH_USGS_MRDS" | "FETCH_BLM_CLAIMS",
  "config": {
    "type": string,
    "boundingBox": {
      "minLon": number,
      "minLat": number,
      "maxLon": number,
      "maxLat": number
    }
  },
  "cron": string
}
Response: { "message": "Data collection scheduled successfully" }
```

## Job Types

### Data Collection Jobs
- `FETCH_USGS_MRDS`: Fetch mineral resource data from USGS MRDS
- `FETCH_BLM_CLAIMS`: Fetch mining claims data from BLM

### Data Processing Jobs
- `PROCESS_GEOJSON`: Process and transform GeoJSON data
- `UPDATE_SPATIAL_INDEX`: Update spatial indexes for optimized queries

### System Maintenance Jobs
- `CLEANUP_OLD_DATA`: Remove outdated data
- `OPTIMIZE_INDEXES`: Optimize database indexes

## Default Jobs

The service automatically schedules these maintenance jobs:

1. Daily data cleanup (runs at midnight)
2. Weekly index optimization (runs Sundays at midnight)

## Error Handling

- Failed jobs are automatically retried up to 3 times with exponential backoff
- Job failures are logged with detailed error information
- Failed jobs are kept in the queue for 1000 entries for debugging
- Completed jobs are kept for 100 entries for reference

## Monitoring

The service provides detailed logging through Pino logger:
- Request logging
- Job execution status
- Error tracking
- Queue events

## Development

### Adding New Job Types

1. Add the job type to `JOB_TYPES` in `config/index.ts`
2. Create appropriate job data interface in `types/index.ts`
3. Implement job processor in relevant queue in `QueueManager`

### Adding New Data Sources

1. Implement data source client in `@gold-map/data-sources` package
2. Add source type to `DataSourceType` in `@gold-map/core`
3. Update job processors to handle new source type

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Contributing

1. Create a feature branch
2. Make changes and test thoroughly
3. Submit a pull request with clear description of changes

## License

MIT License
