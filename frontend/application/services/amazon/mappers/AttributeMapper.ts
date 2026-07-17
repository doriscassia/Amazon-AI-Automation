import { ProcessedProductContext } from '../types';

export class AttributeMapper {
    /**
     * Maps attributes and determines if the product should be listed as Generic.
     */
    mapAttributes(context: ProcessedProductContext): { attributes: Record<string, string>, isGeneric: boolean, brand: string } {
        const rawBrand = context.product.brand || context.aiListing.mandatoryAttributes['Brand'];
        
        // Amazon rule: If brand is unknown or not registered, use 'Genérico'
        const isGeneric = !rawBrand || rawBrand.toUpperCase() === 'GENÉRICO' || rawBrand.toUpperCase() === 'GENERIC';
        const finalBrand = isGeneric ? 'Genérico' : rawBrand;

        const mappedAttributes: Record<string, string> = {
            ...context.aiListing.technicalSpecs,
            ...context.aiListing.mandatoryAttributes,
            'Brand': finalBrand
        };

        return {
            attributes: mappedAttributes,
            isGeneric,
            brand: finalBrand
        };
    }
}
