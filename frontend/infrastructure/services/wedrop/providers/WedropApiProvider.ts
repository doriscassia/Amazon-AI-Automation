import { IWedropProvider, WedropPaginatedResponse, WedropProduct, ConnectionState } from '../types';

/**
 * Placeholder for a future official Wedrop API.
 * Can be swapped with WedropWebProvider without changing any business logic.
 */
export class WedropApiProvider implements IWedropProvider {
    
    async authenticate(email: string, password: string, keepConnected: boolean): Promise<void> {
        console.log("[WedropApiProvider] Authenticating via Official API...");
        throw new Error("Official API not yet available.");
    }

    async checkConnection(): Promise<ConnectionState> {
        return 'DISCONNECTED';
    }

    async getProducts(page: number, limit: number = 50): Promise<WedropPaginatedResponse<WedropProduct>> {
        throw new Error("Official API not yet available.");
    }
}
