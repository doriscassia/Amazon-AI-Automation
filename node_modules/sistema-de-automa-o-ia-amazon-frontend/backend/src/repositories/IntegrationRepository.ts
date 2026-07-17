import { supabaseClient } from '../database/SupabaseClient';

export class IntegrationRepository {
    async findByName(name: string): Promise<any> {
        const { data, error } = await supabaseClient.from('integrations').select('*').eq('name', name).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data;
    }

    async update(id: string, entity: any): Promise<any> {
        const { data, error } = await supabaseClient.from('integrations').update(entity).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data;
    }
}
