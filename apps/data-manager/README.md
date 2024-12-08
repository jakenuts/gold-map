# GeoData Manager

A full-stack TypeScript application for collecting, managing, and visualizing mineral deposit data from USGS sources using PostGIS for spatial data storage.

## Tech Stack

### Backend
- **Node.js** with **Express** for the API server
- **TypeORM** for database ORM with PostgreSQL
- **PostGIS** for spatial data handling
- **Zod** for runtime type validation
- **TypeScript** for type safety

### Frontend
- **React** with **TypeScript**
- **Vite** for development and building
- **React-Leaflet** for interactive mapping
- **Axios** for API requests

### Database
- **PostgreSQL** with **PostGIS** extension running in Docker

## Project Structure

```
src/
├── config/
│   └── database.ts         # Database configuration and connection
├── entities/
│   └── MineralDeposit.ts   # TypeORM entity for mineral deposits
├── services/
│   ├── data-ingestion.ts   # Service for data ingestion and queries
│   └── usgs-client.ts      # USGS API client implementation
├── types/
│   └── MineralDeposit.ts   # TypeScript interfaces
├── web/
│   ├── components/
│   │   └── Map.tsx         # React map component
│   ├── App.tsx            # Main React application
│   └── main.tsx           # Frontend entry point
├── index.ts               # CLI entry point
└── server.ts             # Express server setup
```

## Key Components

### MineralDeposit Entity
```typescript
@Entity('mineral_deposits')
export class MineralDeposit {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
    location!: any;

    // Additional fields for deposit information
}
```

### Data Ingestion Service
Handles data ingestion from USGS and database operations:
- `ingestUSGSData(bbox?: string)`: Fetches and stores new data
- `getDepositsInBoundingBox(minLon, minLat, maxLon, maxLat)`: Spatial queries
- `getAllDeposits()`: Retrieves all stored deposits

### USGS Client
Manages communication with USGS WFS service:
- Fetches mineral deposit data using WFS protocol
- Transforms GeoJSON responses to internal format
- Includes fallback test data
- Extensive error handling and logging

### Map Component
React component for visualizing deposits:
- Uses Leaflet for interactive mapping
- Displays deposit markers with popups
- Supports data refresh functionality

## Getting Started

1. **Prerequisites**
   - Node.js 16+
   - Docker
   - pnpm

2. **Installation**
   ```bash
   pnpm install
   ```

3. **Configuration**
   Create a `.env` file:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=geodata
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   USGS_MRDS_BASE_URL=https://mrdata.usgs.gov/services/wfs/mrds
   DEFAULT_BBOX=-124.407182,40.071180,-122.393331,41.740961
   ```

4. **Start the Application**
   ```bash
   pnpm start
   ```
   This command:
   - Starts PostgreSQL/PostGIS in Docker
   - Launches the backend server (http://localhost:3001)
   - Starts the frontend dev server (http://localhost:3002)

## API Endpoints

- `GET /api/deposits`: Get all mineral deposits
- `GET /api/deposits/bbox/:minLon/:minLat/:maxLon/:maxLat`: Get deposits in bounding box
- `POST /api/deposits/refresh`: Refresh data from USGS

## Development Notes

### Data Flow
1. USGS client fetches data using WFS protocol
2. Data is transformed to internal GeoJSON format
3. TypeORM saves data to PostGIS
4. Frontend fetches and displays data on map

### Debugging
- Check server logs for detailed USGS API interaction
- Database queries are logged in development
- Frontend console shows data processing steps

### Common Issues
- USGS API may have rate limits or timeouts
- Default to test data if API fails
- Check PostGIS extension is enabled
- Verify coordinate systems match (SRID: 4326)

## Extending the Project

### Adding New Data Sources
1. Create new client service (similar to USGSClient)
2. Implement data transformation to match MineralDeposit entity
3. Add new ingestion method to DataIngestionService
4. Update API endpoints as needed

### Enhancing the Map
1. Modify Map.tsx for new features
2. Update styling in styles.css
3. Add new controls or layers as needed

### Database Modifications
1. Update MineralDeposit entity
2. Run TypeORM synchronize
3. Update related services and API endpoints
