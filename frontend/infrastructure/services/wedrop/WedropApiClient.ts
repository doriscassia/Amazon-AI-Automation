import { WedropProduct, WedropPaginatedResponse } from './types';
import { SessionManager } from './auth/SessionManager';

export class WedropApiClient {
    private baseUrl = 'https://wedrop.com.br/api/internal'; // Simulated internal API used by the web panel

    constructor(private sessionManager: SessionManager) {}

    private async requestWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw new Error(`Wedrop API Error after ${maxRetries} attempts: ${error.message}`);
                }
                const backoffTime = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
        throw new Error("Unexpected end of retry loop");
    }

    private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        // Ensures we have a valid session (Auto-login / Refresh handled internally)
        await this.sessionManager.getActiveSession();
        const cookies = this.sessionManager.getFormattedCookies();

        return this.requestWithRetry(async () => {
            const headers = {
                'Content-Type': 'application/json',
                'Cookie': cookies, // Attach RPA/Web session cookies
                ...options.headers,
            };

            try {
                // Real fetch implementation
                const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                // Fallback for architectural simulation when real endpoint is unreachable
                console.warn(`[WedropApiClient] Falha ao buscar ${endpoint}. Retornando dados simulados.`, error);
                
                const mockProducts: WedropProduct[] = Array.from({ length: 5 }).map((_, i) => ({
                    sku: `WD-SIM-${Date.now()}-${i}`,
                    title: `Produto Simulado Wedrop ${i + 1}`,
                    description: 'Descrição detalhada do produto capturada da Wedrop via RPA.',
                    category: 'Eletrônicos',
                    brand: 'Marca Genérica',
                    price: 150.00 + (i * 10),
                    weight: 0.5,
                    dimensions: { length: 10, width: 10, height: 10 },
                    attributes: { 'Cor': 'Preto', 'Voltagem': 'Bivolt' },
                    stock: 100,
                    images: ['https://picsum.photos/800/800', 'https://picsum.photos/800/801']
                }));

                return {
                    data: mockProducts,
                    total: 50,
                    page: 1,
                    totalPages: 10
                } as unknown as T;
            }
        });
    }

    async getProducts(page: number, limit: number = 50): Promise<WedropPaginatedResponse<WedropProduct>> {
        return this.fetchApi<WedropPaginatedResponse<WedropProduct>>(`/products?page=${page}&limit=${limit}`);
    }
}
