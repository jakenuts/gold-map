import 'reflect-metadata';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database.js';
import { DataIngestionService } from './services/data-ingestion.js';

const app = express();
const router = Router();
const port = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

const dataIngestionService = new DataIngestionService();

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection initialized');
  })
  .catch((error: Error) => {
    console.error('Error initializing database:', error);
  });

// Type definitions
interface LocationQuery {
  category?: string;
  subcategory?: string;
}

interface BBoxParams {
  minLon: string;
  minLat: string;
  maxLon: string;
  maxLat: string;
}

interface IngestQuery {
  bbox?: string;
}

// Route handlers
router.get('/locations', async (req: Request<{}, any, any, LocationQuery>, res: Response): Promise<void> => {
  try {
    const { category, subcategory } = req.query;
    const locations = await dataIngestionService.getAllLocations(category, subcategory);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/locations/bbox/:minLon/:minLat/:maxLon/:maxLat', 
  async (req: Request<BBoxParams, any, any, LocationQuery>, res: Response): Promise<void> => {
    try {
      const { minLon, minLat, maxLon, maxLat } = req.params;
      
      // Validate coordinate values
      const coords = [minLon, minLat, maxLon, maxLat].map(Number);
      if (coords.some(isNaN)) {
        res.status(400).json({ 
          error: 'Invalid coordinates',
          details: 'All coordinates must be valid numbers'
        });
        return;
      }

      const [minLonNum, minLatNum, maxLonNum, maxLatNum] = coords;

      // Validate coordinate ranges
      if (minLonNum < -180 || maxLonNum > 180 || minLatNum < -90 || maxLatNum > 90) {
        res.status(400).json({
          error: 'Invalid coordinate ranges',
          details: 'Longitude must be between -180 and 180, latitude between -90 and 90'
        });
        return;
      }

      // Validate min/max relationships
      if (minLonNum > maxLonNum || minLatNum > maxLatNum) {
        res.status(400).json({
          error: 'Invalid bounding box',
          details: 'Minimum values must be less than maximum values'
        });
        return;
      }

      const { category, subcategory } = req.query;
      
      const locations = await dataIngestionService.getLocationsInBoundingBox(
        minLonNum,
        minLatNum,
        maxLonNum,
        maxLatNum,
        category,
        subcategory
      );
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations in bbox:', error);
      res.status(500).json({ 
        error: 'Failed to fetch locations in bbox',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await dataIngestionService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/sources', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sources = await dataIngestionService.getDataSources();
    res.json(sources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/ingest/usgs', async (req: Request<{}, any, any, IngestQuery>, res: Response): Promise<void> => {
  let formattedBbox: string | undefined;

  try {
    const { bbox } = req.query;
    console.log('Received bbox parameter:', bbox);

    // Parse and validate bbox if provided
    if (bbox) {
      try {
        // Split the bbox string into parts and validate
        const parts = decodeURIComponent(bbox).split(',').map(part => part.trim());
        if (parts.length !== 4) {
          res.status(400).json({
            error: 'Invalid bounding box format',
            details: 'Bounding box must be four numbers: minLon,minLat,maxLon,maxLat',
            received: bbox
          });
          return;
        }

        // Parse coordinates
        const coords = parts.map(Number);
        if (coords.some(isNaN)) {
          res.status(400).json({
            error: 'Invalid coordinate values',
            details: 'All coordinates must be valid numbers',
            received: bbox
          });
          return;
        }

        const [minLon, minLat, maxLon, maxLat] = coords;

        // Validate coordinate ranges
        if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
          res.status(400).json({
            error: 'Invalid coordinate ranges',
            details: 'Longitude must be between -180 and 180, latitude between -90 and 90',
            received: { minLon, minLat, maxLon, maxLat }
          });
          return;
        }

        // Validate min/max relationships
        if (minLon > maxLon || minLat > maxLat) {
          res.status(400).json({
            error: 'Invalid bounding box',
            details: 'Minimum values must be less than maximum values',
            received: { minLon, minLat, maxLon, maxLat }
          });
          return;
        }

        // Format bbox with consistent precision
        formattedBbox = coords.map(n => n.toFixed(6)).join(',');
        console.log('Formatted bbox:', formattedBbox);
      } catch (error) {
        res.status(400).json({
          error: 'Invalid bounding box',
          details: error instanceof Error ? error.message : 'Unknown error',
          received: bbox
        });
        return;
      }
    }

    console.log('Starting USGS data ingestion with bbox:', formattedBbox || 'default');
    const locations = await dataIngestionService.ingestUSGSData(formattedBbox);
    
    res.json({
      success: true,
      message: 'USGS data ingestion completed successfully',
      stats: {
        totalLocations: locations.length,
        sources: [...new Set(locations.map(loc => loc.dataSourceId))],
        categories: [...new Set(locations.map(loc => loc.category))],
        bbox: formattedBbox || 'default'
      }
    });
  } catch (error) {
    console.error('Error ingesting USGS data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({ 
      error: 'Failed to ingest USGS data',
      details: error instanceof Error ? error.message : 'Unknown error',
      bbox: formattedBbox || 'default'
    });
  }
});

// Mount the router with the /api prefix
app.use('/api', router);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
