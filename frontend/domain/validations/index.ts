import { Product, Pricing, Listing } from '../entities';

export class DomainValidator {
    static validateProduct(data: Partial<Product>): void {
        if (!data.sku || data.sku.trim() === '') throw new Error("Product SKU is required");
        if (!data.title || data.title.trim() === '') throw new Error("Product title is required");
        if (data.cost !== undefined && data.cost < 0) throw new Error("Product cost cannot be negative");
        if (data.stock !== undefined && data.stock < 0) throw new Error("Product stock cannot be negative");
    }

    static validatePricing(data: Partial<Pricing>): void {
        if (!data.productId) throw new Error("Pricing must be associated with a product");
        if (data.minPrice !== undefined && data.maxPrice !== undefined) {
            if (data.minPrice > data.maxPrice) throw new Error("Min price cannot be greater than max price");
        }
        if (data.currentPrice !== undefined && data.minPrice !== undefined && data.currentPrice < data.minPrice) {
            throw new Error("Current price cannot be lower than min price");
        }
    }

    static validateListing(data: Partial<Listing>): void {
        if (!data.productId) throw new Error("Listing must be associated with a product");
        if (data.price !== undefined && data.price <= 0) throw new Error("Listing price must be greater than zero");
    }
}
