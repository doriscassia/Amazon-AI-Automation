import { 
    Product, Listing, Queue, Pricing, Competitor, Image, 
    AIContent, Integration, AutomationJob, SyncHistory, Log, UserSettings, EntityId 
} from '../entities';

export interface IRepository<T> {
    findById(id: EntityId): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    update(id: EntityId, entity: Partial<T>): Promise<T>;
    delete(id: EntityId): Promise<boolean>;
}

export interface IProductRepository extends IRepository<Product> {
    findBySku(sku: string): Promise<Product | null>;
    findActive(): Promise<Product[]>;
}

export interface IListingRepository extends IRepository<Listing> {
    findByProductId(productId: EntityId): Promise<Listing[]>;
    findByAsin(asin: string): Promise<Listing | null>;
}

export interface IQueueRepository extends IRepository<Queue> {
    findPending(limit: number): Promise<Queue[]>;
    markAsProcessing(id: EntityId): Promise<void>;
}

export interface IPricingRepository extends IRepository<Pricing> {
    findByProductId(productId: EntityId): Promise<Pricing | null>;
}

export interface ICompetitorRepository extends IRepository<Competitor> {
    findByProductId(productId: EntityId): Promise<Competitor[]>;
}

export interface IImageRepository extends IRepository<Image> {
    findByProductId(productId: EntityId): Promise<Image[]>;
    findMainImage(productId: EntityId): Promise<Image | null>;
}

export interface IAIContentRepository extends IRepository<AIContent> {
    findByProductId(productId: EntityId): Promise<AIContent | null>;
}

export interface IIntegrationRepository extends IRepository<Integration> {
    findByName(name: string): Promise<Integration | null>;
}

export interface IAutomationJobRepository extends IRepository<AutomationJob> {
    findDueJobs(currentTime: Date): Promise<AutomationJob[]>;
}

export interface ISyncHistoryRepository extends IRepository<SyncHistory> {
    findByIntegrationId(integrationId: EntityId): Promise<SyncHistory[]>;
}

export interface ILogRepository extends IRepository<Log> {
    findByLevel(level: string): Promise<Log[]>;
    findRecent(limit: number): Promise<Log[]>;
}

export interface IUserSettingsRepository extends IRepository<UserSettings> {
    findByUserId(userId: EntityId): Promise<UserSettings | null>;
}
