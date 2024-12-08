import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database.js';
import { DataIngestionService } from './services/data-ingestion.js';

const app = express();
const port = process.env.PORT || 3001;

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
app.get('/api/deposits', async (req, res) => {
  try {
    const deposits = await dataIngestionService.getAllDeposits();
    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

app.get('/api/deposits/bbox/:minLon/:minLat/:maxLon/:maxLat', async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.params;
    const deposits = await dataIngestionService.getDepositsInBoundingBox(
      Number(minLon),
      Number(minLat),
      Number(maxLon),
      Number(maxLat)
    );
    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits in bbox:', error);
    res.status(500).json({ error: 'Failed to fetch deposits in bbox' });
  }
});

app.post('/api/deposits/refresh', async (req, res) => {
  try {
    const bbox = req.query.bbox as string | undefined;
    const deposits = await dataIngestionService.ingestUSGSData(bbox);
    res.json(deposits);
  } catch (error) {
    console.error('Error refreshing deposits:', error);
    res.status(500).json({ error: 'Failed to refresh deposits' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
