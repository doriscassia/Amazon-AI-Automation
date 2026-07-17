import { Router } from 'express';
import { GeminiImageProvider } from '../providers/images/GeminiImageProvider';

const router = Router();
const imageProvider = new GeminiImageProvider();

router.post('/analyze', async (req, res) => {
    try {
        const { imageUrl, prompt } = req.body;
        const result = await imageProvider.analyzeReferenceImage(imageUrl, prompt);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { prompt, referenceImage } = req.body;
        const result = await imageProvider.generateImage(prompt, referenceImage);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/edit', async (req, res) => {
    try {
        const { imageUrl, prompt } = req.body;
        const result = await imageProvider.editImage(imageUrl, prompt);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
