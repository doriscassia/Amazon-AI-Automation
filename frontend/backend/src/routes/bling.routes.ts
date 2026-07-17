import { Router } from 'express';
import { blingApiProviderInstance } from '../providers/bling/BlingApiProvider';

const router = Router();

// --- Legacy Endpoints ---
router.post('/create-product', async (req, res) => {
    try {
        const success = await blingApiProviderInstance.createProduct(req.body);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/trigger-sync', async (req, res) => {
    try {
        const { sku } = req.body;
        if (!sku) throw new Error("SKU is required");
        const success = await blingApiProviderInstance.triggerAmazonSync(sku);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check-status', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        if (!sku) throw new Error("SKU is required");
        const result = await blingApiProviderInstance.checkSyncStatus(sku);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- New Endpoints ---
router.post('/connect', async (req, res) => {
    try {
        const { authorizationCode } = req.body;
        await blingApiProviderInstance.connect(authorizationCode);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/test-connection', async (req, res) => {
    try {
        const success = await blingApiProviderInstance.testConnection();
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-product', async (req, res) => {
    try {
        const { sku, payload } = req.body;
        const success = await blingApiProviderInstance.updateProduct(sku, payload);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-product', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        const result = await blingApiProviderInstance.getProduct(sku);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sync-inventory', async (req, res) => {
    try {
        const { sku, quantity } = req.body;
        const success = await blingApiProviderInstance.syncInventory(sku, quantity);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sync-price', async (req, res) => {
    try {
        const { sku, price } = req.body;
        const success = await blingApiProviderInstance.syncPrice(sku, price);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/sync-orders', async (req, res) => {
    try {
        const result = await blingApiProviderInstance.syncOrders();
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/link-amazon', async (req, res) => {
    try {
        const { sku, amazonAsin } = req.body;
        const success = await blingApiProviderInstance.linkAmazonListing(sku, amazonAsin);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/disconnect', async (req, res) => {
    try {
        await blingApiProviderInstance.disconnect();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
