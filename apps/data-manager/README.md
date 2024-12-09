# GeoData Manager

A full-stack TypeScript application for collecting, managing, and visualizing geospatial data from various sources, including USGS mineral deposits, using PostGIS for spatial data storage.

## Tech Stack

- Node.js with TypeScript
- PostgreSQL with PostGIS extension
- TypeORM for database management
- Express.js for API endpoints
- React with Vite for the frontend
- Leaflet for map visualization

## Features

- Collects and stores various types of geospatial data
- Currently supports USGS mineral deposit data with extensibility for other data types
- Uses PostGIS for efficient spatial queries
- Interactive map visualization with type-specific styling
- RESTful API for data access

## Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables in `.env`:
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
```

3. Ensure PostgreSQL with PostGIS extension is running

4. Run database migrations:
```bash
pnpm typeorm migration:run
```

5. Start the development server:
```bash
pnpm dev
```

## Database Schema

The application uses a flexible schema to store various types of geospatial data:

### GeoLocation Table
- Stores all types of geographical locations
- Uses PostGIS geometry type for spatial data
- Supports different location types through the `locationType` field
- Stores source-specific data in the `properties` JSONB field

## API Endpoints

- `GET /api/locations` - Get all locations
- `GET /api/locations?type=mineral_deposit` - Get locations of specific type
- `GET /api/locations/bbox?minLon=&minLat=&maxLon=&maxLat=` - Get locations within bounding box
- `POST /api/ingest/usgs` - Trigger USGS data ingestion

## Developer Notes

### Data Structure
- The application uses a generic `GeoLocation` entity for all location types
- The `locationType` field identifies different types of locations (e.g., 'mineral_deposit', 'historical_site', 'geological_feature')
- Source-specific data is stored in the `properties` JSONB field
- Spatial indexing is used for efficient geographical queries

### Map Visualization
- The Map component supports multiple location types with type-specific styling
- Color coding is customizable per location type and properties
- Popups display both common fields and type-specific properties
- Dynamic property rendering based on location type

### Adding New Data Sources
To add a new data source:
1. Create a new client service in `src/services`
2. Implement data transformation to match the `GeoLocation` schema
3. Add new ingestion method to `DataIngestionService`
4. Update the Map component's color scheme and popup rendering if needed
5. Update API endpoints as needed

### Migration Notes
- Database migrations are used instead of schema sync
- Run migrations after pulling new changes: `pnpm typeorm migration:run`
- Create new migrations for schema changes: `pnpm typeorm migration:create`

## Contributing

1. Create a feature branch
2. Make changes and test thoroughly
3. Submit a pull request with clear description of changes

## License

MIT License
