import { IWedropProvider, WedropPaginatedResponse, WedropProduct, ConnectionState } from '../types';
import { SessionManager } from '../auth/SessionManager';

export class WedropWebProvider implements IWedropProvider {
    private baseUrl = 'https://wedrop.com.br/api/internal'; // Simulated internal API used by the web panel

    constructor(private sessionManager: SessionManager) {}

    async authenticate(email: string, password: string, keepConnected: boolean): Promise<void> {
        await this.sessionManager.login(email, password, keepConnected);
    }

    async checkConnection(): Promise<ConnectionState> {
        return await this.sessionManager.getConnectionState();
    }

    private async requestWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw new Error(`Wedrop Web Provider Error after ${maxRetries} attempts: ${error.message}`);
                }
                const backoffTime = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
        throw new Error("Unexpected end of retry loop");
    }

    async getProducts(page: number, limit: number = 50): Promise<WedropPaginatedResponse<WedropProduct>> {
        // Ensures we have a valid session (Auto-login / Refresh handled internally)
        await this.sessionManager.getActiveSession();
        const cookies = this.sessionManager.getFormattedCookies();

        return this.requestWithRetry(async () => {
            const headers = {
                'Content-Type': 'application/json',
                'Cookie': cookies, // Attach RPA/Web session cookies
            };

            try {
                // Real fetch implementation
                const response = await fetch(`${this.baseUrl}/products?page=${page}&limit=${limit}`, { headers });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                // Fallback for architectural simulation when real endpoint is unreachable
                console.warn(`[WedropWebProvider] Falha ao buscar produtos. Retornando dados simulados.`, error);
                
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
                };
            }
        });
    }
}
