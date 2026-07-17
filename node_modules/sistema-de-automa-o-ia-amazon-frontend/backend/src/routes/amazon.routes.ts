import { Router } from 'express';
import { amazonPublicationServiceInstance } from '../providers/amazon/AmazonPublicationService';

const router = Router();

// --- Legacy Endpoints ---
router.post('/create-listing', async (req, res) => {
    try {
        const success = await amazonPublicationServiceInstance.createListing(req.body);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check-status', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        if (!sku) throw new Error("SKU is required");
        const result = await amazonPublicationServiceInstance.checkListingStatus(sku);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- New SP-API Endpoints ---
router.post('/connect', async (req, res) => {
    try {
        await amazonPublicationServiceInstance.connect();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/test-connection', async (req, res) => {
    try {
        const success = await amazonPublicationServiceInstance.testConnection();
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/publish-listing', async (req, res) => {
    try {
        const success = await amazonPublicationServiceInstance.publishListing(req.body);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-listing', async (req, res) => {
    try {
        const { sku, payload } = req.body;
        const success = await amazonPublicationServiceInstance.updateListing(sku, payload);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-listing', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        const success = await amazonPublicationServiceInstance.deleteListing(sku);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-listing', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        const result = await amazonPublicationServiceInstance.getListing(sku);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-listing-status', async (req, res) => {
    try {
        const sku = req.query.sku as string;
        const result = await amazonPublicationServiceInstance.getListingStatus(sku);
        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload-images', async (req, res) => {
    try {
        const { sku, images } = req.body;
        const success = await amazonPublicationServiceInstance.uploadImages(sku, images);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload-inventory', async (req, res) => {
    try {
        const { sku, quantity } = req.body;
        const success = await amazonPublicationServiceInstance.uploadInventory(sku, quantity);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload-price', async (req, res) => {
    try {
        const { sku, price } = req.body;
        const success = await amazonPublicationServiceInstance.uploadPrice(sku, price);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sync-listing', async (req, res) => {
    try {
        const { sku } = req.body;
        const success = await amazonPublicationServiceInstance.syncListing(sku);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/disconnect', async (req, res) => {
    try {
        await amazonPublicationServiceInstance.disconnect();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
