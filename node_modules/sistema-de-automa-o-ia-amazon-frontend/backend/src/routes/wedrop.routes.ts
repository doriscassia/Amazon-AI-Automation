import { Router } from 'express';
import { wedropProviderInstance } from '../providers/wedrop/WedropWebProvider';

const router = Router();

// --- Existing Endpoints ---
router.post('/authenticate', async (req, res) => {
    try {
        const { email, password, keepConnected } = req.body;
        await wedropProviderInstance.authenticate(email, password, keepConnected);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check-connection', async (req, res) => {
    try {
        const state = await wedropProviderInstance.checkConnection();
        res.json({ state });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const result = await wedropProviderInstance.getProducts(page, limit);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- New Endpoints ---
router.post('/login', async (req, res) => {
    try {
        const { email, password, keepConnected } = req.body;
        await wedropProviderInstance.login(email, password, keepConnected);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/is-logged', async (req, res) => {
    try {
        const isLogged = await wedropProviderInstance.isLogged();
        res.json({ isLogged });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/refresh-session', async (req, res) => {
    try {
        await wedropProviderInstance.refreshSession();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/product/:id', async (req, res) => {
    try {
        const result = await wedropProviderInstance.getProduct(req.params.id);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const result = await wedropProviderInstance.getCategories();
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/download-images', async (req, res) => {
    try {
        const { urls } = req.body;
        const result = await wedropProviderInstance.downloadImages(urls);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        await wedropProviderInstance.logout();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
