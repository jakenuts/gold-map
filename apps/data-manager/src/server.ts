import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database.js';
import { DataIngestionService } from './services/data-ingestion.js';

const app = express();
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

// Routes
app.get('/api/locations', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const locations = await dataIngestionService.getAllLocations(type);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.get('/api/locations/bbox/:minLon/:minLat/:maxLon/:maxLat', async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.params;
    const type = req.query.type as string | undefined;
    const locations = await dataIngestionService.getLocationsInBoundingBox(
      Number(minLon),
      Number(minLat),
      Number(maxLon),
      Number(maxLat),
      type
    );
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations in bbox:', error);
    res.status(500).json({ error: 'Failed to fetch locations in bbox' });
  }
});

app.post('/api/ingest/usgs', async (req, res) => {
  try {
    const bbox = req.query.bbox as string | undefined;
    const locations = await dataIngestionService.ingestUSGSData(bbox);
    res.json(locations);
  } catch (error) {
    console.error('Error ingesting USGS data:', error);
    res.status(500).json({ error: 'Failed to ingest USGS data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
