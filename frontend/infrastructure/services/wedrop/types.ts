export interface WedropProductDimensions {
    length: number;
    width: number;
    height: number;
}

export interface WedropProduct {
    sku: string;
    title: string;
    description: string;
    category: string;
    brand: string;
    price: number;
    weight: number;
    dimensions: WedropProductDimensions;
    attributes: Record<string, string>;
    stock: number;
    images: string[]; // IMPORTANT: Used only as references for AI, never published directly
    [key: string]: any; // Catch-all for any other available fields from the API
}

export interface WedropPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

export interface WedropSession {
    cookies: string[];
    token?: string;
    expiresAt: number;
    isValid: boolean;
}

export type ConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'RECONNECTING';

export interface IWedropProvider {
    // Existing contracts (Preserved for backward compatibility)
    authenticate(email: string, password: string, keepConnected: boolean): Promise<void>;
    checkConnection(): Promise<ConnectionState>;
    getProducts(page: number, limit?: number): Promise<WedropPaginatedResponse<WedropProduct>>;

    // New explicit methods requested
    login(email: string, password: string, keepConnected?: boolean): Promise<void>;
    isLogged(): Promise<boolean>;
    refreshSession(): Promise<void>;
    getProduct(id: string): Promise<WedropProduct>;
    getCategories(): Promise<string[]>;
    downloadImages(urls: string[]): Promise<Record<string, string>>;
    logout(): Promise<void>;
}

export interface IWedropAuthenticationProvider {
    login(email: string, password: string): Promise<WedropSession>;
    validateSession(session: WedropSession): Promise<boolean>;
    refreshSession(session: WedropSession): Promise<WedropSession>;
}

export interface ICookieManager {
    parseCookies(cookieHeader: string): string[];
    formatCookies(cookies: string[]): string;
    clearCookies(): void;
}
