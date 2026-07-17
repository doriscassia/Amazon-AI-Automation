import { IRepository } from '../../domain/repositories';
import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseSupabaseRepository<T extends { id: string }> implements IRepository<T> {
    constructor(protected client: SupabaseClient, protected tableName: string) {}

    async findById(id: string): Promise<T | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('id', id).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as T | null;
    }

    async findAll(): Promise<T[]> {
        const { data, error } = await this.client.from(this.tableName).select('*');
        if (error) throw new Error(error.message);
        return data as T[];
    }

    async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
        const payload = {
            ...entity,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const { data, error } = await this.client.from(this.tableName).insert(payload).select().single();
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Failed to create record');
        return data as T;
    }

    async update(id: string, entity: Partial<T>): Promise<T> {
        const payload = {
            ...entity,
            updatedAt: new Date().toISOString()
        };
        const { data, error } = await this.client.from(this.tableName).update(payload).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Failed to update record');
        return data as T;
    }

    async delete(id: string): Promise<boolean> {
        const { error } = await this.client.from(this.tableName).delete().eq('id', id);
        if (error) throw new Error(error.message);
        return true;
    }
}
