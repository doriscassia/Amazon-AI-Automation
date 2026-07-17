import { 
    IProductRepository, IListingRepository, IQueueRepository, IPricingRepository 
} from '../../domain/repositories';
import { Product, Listing, Pricing } from '../../domain/entities';
import { DomainValidator } from '../../domain/validations';

export class ProductManagementService {
    constructor(
        private productRepo: IProductRepository,
        private pricingRepo: IPricingRepository
    ) {}

    async registerNewProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, initialPricing?: Omit<Pricing, 'id' | 'createdAt' | 'updatedAt' | 'productId'>): Promise<Product> {
        DomainValidator.validateProduct(productData);
        
        const existing = await this.productRepo.findBySku(productData.sku);
        if (existing) {
            throw new Error(`Product with SKU ${productData.sku} already exists`);
        }

        const product = await this.productRepo.create(productData);

        if (initialPricing) {
            DomainValidator.validatePricing({ ...initialPricing, productId: product.id });
            await this.pricingRepo.create({
                ...initialPricing,
                productId: product.id
            });
        }

        return product;
    }

    async updateStock(sku: string, newStock: number): Promise<Product> {
        if (newStock < 0) throw new Error("Stock cannot be negative");
        
        const product = await this.productRepo.findBySku(sku);
        if (!product) throw new Error(`Product with SKU ${sku} not found`);

        return this.productRepo.update(product.id, { stock: newStock });
    }
}

export class ListingManagementService {
    constructor(
        private listingRepo: IListingRepository,
        private queueRepo: IQueueRepository
    ) {}

    async prepareListingForAmazon(productId: string, price: number): Promise<Listing> {
        DomainValidator.validateListing({ productId, price });

        const listing = await this.listingRepo.create({
            productId,
            price,
            status: 'DRAFT',
            amazonAsin: null,
            errorMessage: null,
            publishedAt: null
        });

        await this.queueRepo.create({
            type: 'PUBLISH_AMAZON',
            status: 'PENDING',
            payload: { listingId: listing.id, productId },
            attempts: 0,
            maxAttempts: 3,
            lastAttemptAt: null,
            errorMessage: null
        });

        return listing;
    }
}
