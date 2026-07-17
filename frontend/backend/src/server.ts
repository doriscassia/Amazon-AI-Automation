import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import aiRoutes from './routes/ai.routes';
import imagesRoutes from './routes/images.routes';
import wedropRoutes from './routes/wedrop.routes';
import amazonRoutes from './routes/amazon.routes';
import blingRoutes from './routes/bling.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Register Routes
app.use('/api/ai', aiRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/wedrop', wedropRoutes);
app.use('/api/amazon', amazonRoutes);
app.use('/api/bling', blingRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`[Backend] Server running locally on http://localhost:${PORT}`);
});
