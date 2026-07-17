// Domain Layer: Interfaces defining the contracts for our services.
// No implementation details here, just the shape of the data and operations.

export interface IAIService {
    generateListing(productData: any): Promise<any>;
    analyzeImage(imageUrl: string): Promise<any>;
}

export interface IWedropService {
    fetchProducts(): Promise<any[]>;
    syncInventory(): Promise<void>;
}

export interface IAmazonService {
    publishListing(listingData: any): Promise<boolean>;
    updatePrice(sku: string, price: number): Promise<boolean>;
}

export interface IBlingService {
    createOrder(orderData: any): Promise<string>;
    updateStock(sku: string, quantity: number): Promise<void>;
}

export interface IPricingService {
    calculateOptimalPrice(cost: number, competitorPrices: number[]): number;
}

export interface IMonitoringService {
    logEvent(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
    getSystemHealth(): Promise<{ status: string; uptime: number }>;
}
