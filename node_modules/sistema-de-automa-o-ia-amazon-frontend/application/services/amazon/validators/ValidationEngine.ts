import { AmazonListingPayload, ValidationResult } from '../types';

export class ValidationEngine {
    validate(payload: AmazonListingPayload): ValidationResult {
        const errors: string[] = [];

        if (!payload.sku) errors.push("SKU is mandatory.");
        if (!payload.title || payload.title.length > 200) errors.push("Title is mandatory and must be under 200 characters.");
        if (!payload.description) errors.push("Description is mandatory.");
        if (!payload.bulletPoints || payload.bulletPoints.length === 0) errors.push("At least one bullet point is required.");
        if (payload.price <= 0) errors.push("Price must be greater than zero.");
        if (payload.quantity < 0) errors.push("Quantity cannot be negative.");
        if (!payload.brand) errors.push("Brand is mandatory (use 'Genérico' if none).");
        if (!payload.mainImage) errors.push("Main image is mandatory.");
        if (!payload.categoryNodeId) errors.push("Category Node ID is mandatory.");

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
