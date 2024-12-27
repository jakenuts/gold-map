# Data Sources

## Overview

Gold Map integrates with multiple data sources to provide comprehensive mining and mineral resource information. This documentation covers the available data sources, their APIs, and data schemas.

## USGS Mineral Resources Data System (MRDS)

### API Endpoint
```
https://mrdata.usgs.gov/mrds/api/v1
```

### Features
- Mineral resource locations
- Deposit information
- Historical production data
- Geological context

### Data Schema
```typescript
interface MRDSFeature {
  mrdsId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    state: string;
    county?: string;
  };
  commodities: string[];
  depositType?: string;
  development?: string;
  production?: {
    size?: string;
    years?: number[];
    commodities?: Record<string, number>;
  };
  geology?: {
    hostRocks?: string[];
    oreControls?: string[];
    alteration?: string[];
    mineralogy?: string[];
  };
  references?: string[];
  lastUpdate?: string;
}
```

## BLM Mining Claims

### API Endpoint
```
https://gis.blm.gov/arcgis/rest/services/mining_claims/MapServer/0
```

### Features
- Active and closed claims
- Claim boundaries
- Ownership information
- Claim types (lode, placer, etc.)

### Data Schema
```typescript
interface BLMClaim {
  caseId: string;
  claimName: string;
  claimType: 'Lode' | 'Placer' | 'Mill Site' | 'Tunnel Site';
  status: string;
  disposition: string;
  location: {
    township: string;
    range: string;
    section: string;
    meridian: string;
    county: string;
    state: string;
  };
  acres: number;
  lastAction?: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}
```

## Data Integration

### Collection Process
1. Scheduled data collection jobs
2. Rate-limited API requests
3. Data validation and transformation
4. Storage in PostgreSQL with PostGIS

### Update Frequency
- USGS MRDS: Daily updates
- BLM Claims: Daily updates
- System maintenance: Weekly

## Common Data Format

All data sources are transformed into a common GeoJSON format:

```typescript
interface GeoFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    name: string;
    source: 'USGS_MRDS' | 'BLM_CLAIMS';
    [key: string]: any; // Source-specific properties
  };
}
```

## Data Quality

### Validation Rules
1. Coordinate validation
   - Valid longitude range: -180 to 180
   - Valid latitude range: -90 to 90

2. Required Fields
   - Feature ID
   - Feature Name
   - Coordinates
   - Data Source

3. Data Cleaning
   - Standardize property names
   - Convert units where necessary
   - Handle missing values

### Error Handling
1. Invalid Coordinates
   - Log error
   - Skip feature
   - Report in job results

2. Missing Required Fields
   - Attempt to fill from other fields
   - Skip if unfixable
   - Log for review

3. API Failures
   - Retry with backoff
   - Alert on persistent failures
   - Continue with partial data

## Usage Examples

### Fetching USGS MRDS Data
```typescript
import { createClient } from '@gold-map/data-sources';

const client = createClient({
  type: 'USGS_MRDS',
  boundingBox: {
    minLon: -124.4071825,
    maxLon: -122.3933314,
    minLat: 40.0711794,
    maxLat: 41.7410164
  }
});

const data = await client.fetchData();
```

### Fetching BLM Claims
```typescript
import { createClient } from '@gold-map/data-sources';

const client = createClient({
  type: 'BLM_CLAIMS',
  boundingBox: {
    minLon: -124.4071825,
    maxLon: -122.3933314,
    minLat: 40.0711794,
    maxLat: 41.7410164
  },
  options: {
    claimTypes: ['Lode', 'Placer'],
    claimStatus: ['Active']
  }
});

const data = await client.fetchData();
```

## Adding New Data Sources

1. Create Client Implementation
   ```typescript
   import { BaseClient } from '@gold-map/data-sources';

   export class NewSourceClient extends BaseClient {
     async fetchData(config: DataSourceConfig): Promise<GeoFeatureCollection> {
       // Implementation
     }
   }
   ```

2. Add Source Type
   ```typescript
   // In @gold-map/core
   export type DataSourceType = 
     | 'USGS_MRDS'
     | 'BLM_CLAIMS'
     | 'NEW_SOURCE';
   ```

3. Update Factory
   ```typescript
   // In @gold-map/data-sources
   export function createClient(config: DataSourceConfig): DataSourceClient {
     switch (config.type) {
       case 'NEW_SOURCE':
         return new NewSourceClient(config);
       // ...
     }
   }
   ```

## Rate Limiting

Each data source has specific rate limits:

| Source | Requests/Second | Daily Limit |
|--------|----------------|-------------|
| USGS MRDS | 2 | Unlimited |
| BLM Claims | 2 | Unlimited |

The system automatically handles rate limiting and retries.
