import { IAmazonApiProvider, AmazonListingPayload } from '../../../application/services/amazon/types';

export class AmazonProviderProxy implements IAmazonApiProvider {
    private baseUrl = 'http://localhost:3000/api/amazon';

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
    async createListing(payload: AmazonListingPayload): Promise<boolean> {
        const data = await this.request('/create-listing', 'POST', payload);
        return data.success;
    }

    async checkListingStatus(sku: string): Promise<{ exists: boolean; status: string; asin?: string; listingId?: string; url?: string }> {
        const data = await this.request(`/check-status?sku=${sku}`);
        return data.result;
    }

    // --- New SP-API Methods ---
    async connect(): Promise<void> {
        await this.request('/connect', 'POST');
    }

    async testConnection(): Promise<boolean> {
        const data = await this.request('/test-connection');
        return data.success;
    }

    async publishListing(payload: AmazonListingPayload): Promise<boolean> {
        const data = await this.request('/publish-listing', 'POST', payload);
        return data.success;
    }

    async updateListing(sku: string, payload: Partial<AmazonListingPayload>): Promise<boolean> {
        const data = await this.request('/update-listing', 'PUT', { sku, payload });
        return data.success;
    }

    async deleteListing(sku: string): Promise<boolean> {
        const data = await this.request(`/delete-listing?sku=${sku}`, 'DELETE');
        return data.success;
    }

    async getListing(sku: string): Promise<any> {
        const data = await this.request(`/get-listing?sku=${sku}`);
        return data.result;
    }

    async getListingStatus(sku: string): Promise<any> {
        const data = await this.request(`/get-listing-status?sku=${sku}`);
        return data.result;
    }

    async uploadImages(sku: string, images: string[]): Promise<boolean> {
        const data = await this.request('/upload-images', 'POST', { sku, images });
        return data.success;
    }

    async uploadInventory(sku: string, quantity: number): Promise<boolean> {
        const data = await this.request('/upload-inventory', 'POST', { sku, quantity });
        return data.success;
    }

    async uploadPrice(sku: string, price: number): Promise<boolean> {
        const data = await this.request('/upload-price', 'POST', { sku, price });
        return data.success;
    }

    async syncListing(sku: string): Promise<boolean> {
        const data = await this.request('/sync-listing', 'POST', { sku });
        return data.success;
    }

    async disconnect(): Promise<void> {
        await this.request('/disconnect', 'POST');
    }
}
