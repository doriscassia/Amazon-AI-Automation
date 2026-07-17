import { BaseSupabaseRepository } from './BaseSupabaseRepository';
import { IProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities';
import { SupabaseClient } from '@supabase/supabase-js';

export class ProductRepository extends BaseSupabaseRepository<Product> implements IProductRepository {
    constructor(client: SupabaseClient) {
        super(client, 'products');
    }

    async findBySku(sku: string): Promise<Product | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('sku', sku).single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is Supabase's "not found" error
            throw new Error(error.message);
        }
        return data as Product | null;
    }

    async findActive(): Promise<Product[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('active', true);
        if (error) throw new Error(error.message);
        return data as Product[];
    }
}
