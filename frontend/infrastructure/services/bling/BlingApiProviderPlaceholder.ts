import { IBlingApiProvider, BlingProductPayload } from '../../../application/services/bling/types';

/**
 * Structural placeholder for Bling ERP API integration.
 * Ensures the architecture compiles and functions structurally without making actual API calls yet.
 */
export class BlingApiProviderPlaceholder implements IBlingApiProvider {
    
    async createProduct(payload: BlingProductPayload): Promise<boolean> {
        console.log(`[Bling API Placeholder] Creating product in Bling for SKU: ${payload.codigo}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate successful creation
        return true;
    }

    async triggerAmazonSync(sku: string): Promise<boolean> {
        console.log(`[Bling API Placeholder] Triggering Bling -> Amazon sync for SKU: ${sku}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Simulate successful trigger
        return true;
    }

    async checkSyncStatus(sku: string): Promise<{ isSynced: boolean; status: string }> {
        console.log(`[Bling API Placeholder] Checking Bling -> Amazon sync status for SKU: ${sku}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate successful validation
        return {
            isSynced: true,
            status: 'SYNCED_SUCCESSFULLY'
        };
    }
}
