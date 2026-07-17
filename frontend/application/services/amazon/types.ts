import { Product } from '../../../domain/entities';
import { OptimizedListing } from '../ai/types';
import { PricingResult } from '../pricing/types';
import { GeneratedImage } from '../images/types';

export type PublicationState = 
    | 'AWAITING' 
    | 'PREPARING' 
    | 'PUBLISHING' 
    | 'VALIDATING' 
    | 'PUBLISHED' 
    | 'ERROR' 
    | 'AWAITING_INTERVENTION';

export interface ProcessedProductContext {
    product: Product;
    aiListing: OptimizedListing;
    pricing: PricingResult;
    images: GeneratedImage[];
}

export interface AmazonListingPayload {
    sku: string;
    title: string;
    description: string;
    bulletPoints: string[];
    price: number;
    quantity: number;
    brand: string;
    manufacturer: string;
    categoryNodeId: string;
    mainImage: string;
    otherImages: string[];
    attributes: Record<string, string>;
    searchTerms: string[];
    isGeneric: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface IAmazonApiProvider {
    // Legacy methods for backward compatibility
    createListing(payload: AmazonListingPayload): Promise<boolean>;
    checkListingStatus(sku: string): Promise<{ exists: boolean; status: string; asin?: string }>;

    // New SP-API explicit methods
    connect(): Promise<void>;
    testConnection(): Promise<boolean>;
    publishListing(payload: AmazonListingPayload): Promise<boolean>;
    updateListing(sku: string, payload: Partial<AmazonListingPayload>): Promise<boolean>;
    deleteListing(sku: string): Promise<boolean>;
    getListing(sku: string): Promise<any>;
    getListingStatus(sku: string): Promise<any>;
    uploadImages(sku: string, images: string[]): Promise<boolean>;
    uploadInventory(sku: string, quantity: number): Promise<boolean>;
    uploadPrice(sku: string, price: number): Promise<boolean>;
    syncListing(sku: string): Promise<boolean>;
    disconnect(): Promise<void>;
}
