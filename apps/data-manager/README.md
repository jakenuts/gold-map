# GeoData Manager

A TypeScript-based application for collecting and managing geospatial data from various sources, storing it in PostGIS, and making it available for web mapping applications.

## Features

- Fetches mineral deposit data from USGS MRDS service
- Stores geospatial data in PostGIS database
- Supports spatial queries using PostGIS
- Modern TypeScript/Node.js architecture
- Docker-based local development environment

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- pnpm (recommended) or npm

## Setup

1. Clone the repository and install dependencies:
```bash
pnpm install
```

2. Create a `.env` file (or copy from .env.example):
```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=geodata
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# USGS Data Source
USGS_MRDS_BASE_URL=https://mrdata.usgs.gov/services/wfs/mrds
DEFAULT_BBOX=-124.407182,40.071180,-122.393331,41.740961
```

3. Start the PostGIS database:
```bash
docker-compose up -d
```

## Usage

### Ingest USGS Data

To ingest data from USGS MRDS with the default bounding box:
```bash
pnpm start ingest
```

To specify a custom bounding box:
```bash
pnpm start ingest "-124.407182,40.071180,-122.393331,41.740961"
```

### Query Data

To query deposits within a bounding box:
```bash
pnpm start query <minLng> <minLat> <maxLng> <maxLat>
```

Example:
```bash
pnpm start query -124.407182 40.071180 -122.393331 41.740961
```

## Development

Start the application in development mode with auto-reload:
```bash
pnpm dev
```

Run type checking:
```bash
pnpm typecheck
```

Format code:
```bash
pnpm format
```

Run linting:
```bash
pnpm lint
```

## Project Structure

```
.
├── src/
│   ├── config/         # Configuration files
│   ├── entities/       # TypeORM entities
│   ├── services/       # Business logic services
│   └── index.ts        # Application entry point
├── docker-compose.yml  # Docker configuration
├── .env               # Environment variables
└── tsconfig.json      # TypeScript configuration
```

## Database Schema

The main entity is `MineralDeposit` which stores geospatial data with the following structure:

- `id`: UUID primary key
- `name`: Deposit name
- `depositType`: Type of mineral deposit
- `commodities`: Primary commodities
- `location`: PostGIS Point geometry (SRID: 4326)
- `properties`: JSONB field for additional properties
- `source`: Data source identifier
- `sourceId`: Original ID from the data source
- `createdAt`: Timestamp of record creation
- `updatedAt`: Timestamp of last update

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC
