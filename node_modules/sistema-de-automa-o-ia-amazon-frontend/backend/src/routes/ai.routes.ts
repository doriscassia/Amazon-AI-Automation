import { Router } from 'express';
import { GeminiProvider } from '../providers/ai/GeminiProvider';

const router = Router();
const aiProvider = new GeminiProvider();

router.post('/generate-content', async (req, res) => {
    try {
        const { systemInstruction, prompt, context } = req.body;
        const result = await aiProvider.generateContent(systemInstruction, prompt, context);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/generate-structured-content', async (req, res) => {
    try {
        const { systemInstruction, prompt, context, schemaName } = req.body;
        const result = await aiProvider.generateStructuredContent(systemInstruction, prompt, context, schemaName);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
