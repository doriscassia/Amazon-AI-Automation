import { IBlingApiProvider, BlingProductPayload } from '../../../application/services/bling/types';

export class BlingProviderProxy implements IBlingApiProvider {
    private baseUrl = 'http://localhost:3000/api/bling';

    private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(`${this.baseUrl}${endpoint}`, options);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || await res.text());
        }
        return await res.json();
    }

    // --- Legacy Methods ---
    async createProduct(payload: BlingProductPayload): Promise<boolean> {
        const data = await this.request('/create-product', 'POST', payload);
        return data.success;
    }

    async triggerAmazonSync(sku: string): Promise<boolean> {
        const data = await this.request('/trigger-sync', 'POST', { sku });
        return data.success;
    }

    async checkSyncStatus(sku: string): Promise<{ isSynced: boolean; status: string }> {
        const data = await this.request(`/check-status?sku=${sku}`);
        return data.result;
    }

    // --- New Methods ---
    async connect(authorizationCode?: string): Promise<void> {
        await this.request('/connect', 'POST', { authorizationCode });
    }

    async testConnection(): Promise<boolean> {
        const data = await this.request('/test-connection');
        return data.success;
    }

    async updateProduct(sku: string, payload: Partial<BlingProductPayload>): Promise<boolean> {
        const data = await this.request('/update-product', 'PUT', { sku, payload });
        return data.success;
    }

    async getProduct(sku: string): Promise<any> {
        const data = await this.request(`/get-product?sku=${sku}`);
        return data.result;
    }

    async syncInventory(sku: string, quantity: number): Promise<boolean> {
        const data = await this.request('/sync-inventory', 'POST', { sku, quantity });
        return data.success;
    }

    async syncPrice(sku: string, price: number): Promise<boolean> {
        const data = await this.request('/sync-price', 'POST', { sku, price });
        return data.success;
    }

    async syncOrders(): Promise<any[]> {
        const data = await this.request('/sync-orders');
        return data.result;
    }

    async linkAmazonListing(sku: string, amazonAsin: string): Promise<boolean> {
        const data = await this.request('/link-amazon', 'POST', { sku, amazonAsin });
        return data.success;
    }

    async disconnect(): Promise<void> {
        await this.request('/disconnect', 'POST');
    }
}
