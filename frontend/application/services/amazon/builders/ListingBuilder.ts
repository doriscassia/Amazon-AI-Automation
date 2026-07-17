import { ProcessedProductContext, AmazonListingPayload } from '../types';
import { CategoryMapper } from '../mappers/CategoryMapper';
import { AttributeMapper } from '../mappers/AttributeMapper';

export class ListingBuilder {
    constructor(
        private categoryMapper: CategoryMapper,
        private attributeMapper: AttributeMapper
    ) {}

    build(context: ProcessedProductContext): AmazonListingPayload {
        const { attributes, isGeneric, brand } = this.attributeMapper.mapAttributes(context);
        const categoryNodeId = this.categoryMapper.mapToAmazonNodeId(context.product.category);

        const mainImage = context.images.find(img => img.type === 'MAIN')?.url || '';
        const otherImages = context.images.filter(img => img.type !== 'MAIN').map(img => img.url);

        return {
            sku: context.product.sku,
            title: context.aiListing.title,
            description: context.aiListing.description,
            bulletPoints: context.aiListing.bulletPoints,
            price: context.pricing.metrics.suggestedPrice,
            quantity: context.product.stock,
            brand: brand,
            manufacturer: brand, // Often the same for generic/white-label
            categoryNodeId,
            mainImage,
            otherImages,
            attributes,
            searchTerms: context.aiListing.searchTerms,
            isGeneric
        };
    }
}
