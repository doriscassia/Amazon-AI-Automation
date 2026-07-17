import { BaseSupabaseRepository } from './BaseSupabaseRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    IListingRepository, IQueueRepository, IPricingRepository,
    ICompetitorRepository, IImageRepository, IAIContentRepository,
    IIntegrationRepository, IAutomationJobRepository, ISyncHistoryRepository,
    ILogRepository, IUserSettingsRepository
} from '../../domain/repositories';
import {
    Listing, Queue, Pricing, Competitor, Image, AIContent,
    Integration, AutomationJob, SyncHistory, Log, UserSettings
} from '../../domain/entities';

export class ListingRepository extends BaseSupabaseRepository<Listing> implements IListingRepository {
    constructor(client: SupabaseClient) { super(client, 'listings'); }
    async findByProductId(productId: string): Promise<Listing[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId);
        if (error) throw new Error(error.message);
        return data as Listing[];
    }
    async findByAsin(asin: string): Promise<Listing | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('amazonAsin', asin).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Listing | null;
    }
}

export class QueueRepository extends BaseSupabaseRepository<Queue> implements IQueueRepository {
    constructor(client: SupabaseClient) { super(client, 'queues'); }
    async findPending(limit: number): Promise<Queue[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('status', 'PENDING').order('createdAt', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);
        return data as Queue[];
    }
    async markAsProcessing(id: string): Promise<void> {
        const { error } = await this.client.from(this.tableName).update({ status: 'PROCESSING', updatedAt: new Date().toISOString() }).eq('id', id);
        if (error) throw new Error(error.message);
    }
}

export class PricingRepository extends BaseSupabaseRepository<Pricing> implements IPricingRepository {
    constructor(client: SupabaseClient) { super(client, 'pricings'); }
    async findByProductId(productId: string): Promise<Pricing | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Pricing | null;
    }
}

export class CompetitorRepository extends BaseSupabaseRepository<Competitor> implements ICompetitorRepository {
    constructor(client: SupabaseClient) { super(client, 'competitors'); }
    async findByProductId(productId: string): Promise<Competitor[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId);
        if (error) throw new Error(error.message);
        return data as Competitor[];
    }
}

export class ImageRepository extends BaseSupabaseRepository<Image> implements IImageRepository {
    constructor(client: SupabaseClient) { super(client, 'images'); }
    async findByProductId(productId: string): Promise<Image[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId);
        if (error) throw new Error(error.message);
        return data as Image[];
    }
    async findMainImage(productId: string): Promise<Image | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId).eq('isMain', true).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Image | null;
    }
}

export class AIContentRepository extends BaseSupabaseRepository<AIContent> implements IAIContentRepository {
    constructor(client: SupabaseClient) { super(client, 'ai_contents'); }
    async findByProductId(productId: string): Promise<AIContent | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('productId', productId).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as AIContent | null;
    }
}

export class IntegrationRepository extends BaseSupabaseRepository<Integration> implements IIntegrationRepository {
    constructor(client: SupabaseClient) { super(client, 'integrations'); }
    async findByName(name: string): Promise<Integration | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('name', name).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as Integration | null;
    }
}

export class AutomationJobRepository extends BaseSupabaseRepository<AutomationJob> implements IAutomationJobRepository {
    constructor(client: SupabaseClient) { super(client, 'automation_jobs'); }
    async findDueJobs(currentTime: Date): Promise<AutomationJob[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('status', 'ACTIVE').lte('nextRunAt', currentTime.toISOString());
        if (error) throw new Error(error.message);
        return data as AutomationJob[];
    }
}

export class SyncHistoryRepository extends BaseSupabaseRepository<SyncHistory> implements ISyncHistoryRepository {
    constructor(client: SupabaseClient) { super(client, 'sync_histories'); }
    async findByIntegrationId(integrationId: string): Promise<SyncHistory[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('integrationId', integrationId).order('createdAt', { ascending: false });
        if (error) throw new Error(error.message);
        return data as SyncHistory[];
    }
}

export class LogRepository extends BaseSupabaseRepository<Log> implements ILogRepository {
    constructor(client: SupabaseClient) { super(client, 'logs'); }
    async findByLevel(level: string): Promise<Log[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('level', level);
        if (error) throw new Error(error.message);
        return data as Log[];
    }
    async findRecent(limit: number): Promise<Log[]> {
        const { data, error } = await this.client.from(this.tableName).select('*').order('createdAt', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data as Log[];
    }
}

export class UserSettingsRepository extends BaseSupabaseRepository<UserSettings> implements IUserSettingsRepository {
    constructor(client: SupabaseClient) { super(client, 'user_settings'); }
    async findByUserId(userId: string): Promise<UserSettings | null> {
        const { data, error } = await this.client.from(this.tableName).select('*').eq('userId', userId).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data as UserSettings | null;
    }
}
