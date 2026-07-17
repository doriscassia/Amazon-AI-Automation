import { BlingIntegrationContext, BlingProductPayload, IBlingApiProvider } from '../types';

export class ProductSyncEngine {
    constructor(private apiProvider: IBlingApiProvider) {}

    async createProductInBling(context: BlingIntegrationContext): Promise<boolean> {
        const payload: BlingProductPayload = {
            codigo: context.sku, // Guaranteed to be Wedrop SKU by SKUValidator
            descricao: context.title,
            preco: context.price,
            estoque: context.stock
        };

        return await this.apiProvider.createProduct(payload);
    }

    async triggerAmazonSync(sku: string): Promise<boolean> {
        return await this.apiProvider.triggerAmazonSync(sku);
    }
}
