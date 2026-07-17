import { IWedropProvider, WedropPaginatedResponse, WedropProduct, ConnectionState } from '../types';

export class WedropProviderProxy implements IWedropProvider {
    private baseUrl = 'http://localhost:3000/api/wedrop';

    // --- Existing Methods ---
    async authenticate(email: string, password: string, keepConnected: boolean): Promise<void> {
        return this.login(email, password, keepConnected);
    }

    async checkConnection(): Promise<ConnectionState> {
        const res = await fetch(`${this.baseUrl}/check-connection`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.state;
    }

    async getProducts(page: number, limit: number = 50): Promise<WedropPaginatedResponse<WedropProduct>> {
        const res = await fetch(`${this.baseUrl}/products?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    // --- New Methods ---
    async login(email: string, password: string, keepConnected: boolean = true): Promise<void> {
        const res = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, keepConnected })
        });
        if (!res.ok) throw new Error(await res.text());
    }

    async isLogged(): Promise<boolean> {
        const res = await fetch(`${this.baseUrl}/is-logged`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.isLogged;
    }

    async refreshSession(): Promise<void> {
        const res = await fetch(`${this.baseUrl}/refresh-session`, { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
    }

    async getProduct(id: string): Promise<WedropProduct> {
        const res = await fetch(`${this.baseUrl}/product/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async getCategories(): Promise<string[]> {
        const res = await fetch(`${this.baseUrl}/categories`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async downloadImages(urls: string[]): Promise<Record<string, string>> {
        const res = await fetch(`${this.baseUrl}/download-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async logout(): Promise<void> {
        const res = await fetch(`${this.baseUrl}/logout`, { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
    }
}
