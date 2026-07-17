export type BlingSyncState = 
    | 'AWAITING' 
    | 'SYNCING' 
    | 'SYNCED' 
    | 'VALIDATING' 
    | 'COMPLETED' 
    | 'ERROR' 
    | 'AWAITING_INTERVENTION';

export interface BlingIntegrationContext {
    sku: string;
    originalWedropSku: string;
    title: string;
    price: number;
    stock: number;
    isAmazonPublished: boolean; // CRITICAL: Must be true to proceed
}

export interface BlingProductPayload {
    codigo: string; // SKU
    descricao: string; // Title
    preco: number;
    estoque: number;
}

export interface IBlingApiProvider {
    // Legacy methods for backward compatibility
    createProduct(payload: BlingProductPayload): Promise<boolean>;
    triggerAmazonSync(sku: string): Promise<boolean>;
    checkSyncStatus(sku: string): Promise<{ isSynced: boolean; status: string }>;

    // New explicit methods for full integration
    connect(authorizationCode?: string): Promise<void>;
    testConnection(): Promise<boolean>;
    updateProduct(sku: string, payload: Partial<BlingProductPayload>): Promise<boolean>;
    getProduct(sku: string): Promise<any>;
    syncInventory(sku: string, quantity: number): Promise<boolean>;
    syncPrice(sku: string, price: number): Promise<boolean>;
    syncOrders(): Promise<any[]>;
    linkAmazonListing(sku: string, amazonAsin: string): Promise<boolean>;
    disconnect(): Promise<void>;
}
