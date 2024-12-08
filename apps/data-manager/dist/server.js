import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { DataIngestionService } from './services/data-ingestion';
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
    .catch((error) => {
    console.error('Error initializing database:', error);
});
// Routes
app.get('/api/deposits', async (req, res) => {
    try {
        const deposits = await dataIngestionService.getAllDeposits();
        res.json(deposits);
    }
    catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({ error: 'Failed to fetch deposits' });
    }
});
app.get('/api/deposits/bbox/:bbox', async (req, res) => {
    try {
        const { bbox } = req.params;
        const deposits = await dataIngestionService.getDepositsInBoundingBox(bbox);
        res.json(deposits);
    }
    catch (error) {
        console.error('Error fetching deposits in bbox:', error);
        res.status(500).json({ error: 'Failed to fetch deposits in bbox' });
    }
});
app.post('/api/deposits/refresh', async (req, res) => {
    try {
        const bbox = req.query.bbox;
        const deposits = await dataIngestionService.ingestUSGSData(bbox);
        res.json(deposits);
    }
    catch (error) {
        console.error('Error refreshing deposits:', error);
        res.status(500).json({ error: 'Failed to refresh deposits' });
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map