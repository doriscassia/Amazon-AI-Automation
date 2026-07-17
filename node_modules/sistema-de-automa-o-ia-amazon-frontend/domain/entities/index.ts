export type EntityId = string;

export interface BaseEntity {
    id: EntityId;
    createdAt: Date;
    updatedAt: Date;
}

export interface Product extends BaseEntity {
    sku: string;
    title: string;
    description: string | null;
    cost: number;
    stock: number;
    active: boolean;
    brand: string | null;
    category: string | null;
}

export interface Listing extends BaseEntity {
    productId: EntityId;
    amazonAsin: string | null;
    status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'ERROR';
    price: number;
    errorMessage: string | null;
    publishedAt: Date | null;
}

export interface Queue extends BaseEntity {
    type: 'SYNC_WEDROP' | 'GENERATE_AI' | 'PUBLISH_AMAZON' | 'UPDATE_PRICE';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    payload: Record<string, any>;
    attempts: number;
    maxAttempts: number;
    lastAttemptAt: Date | null;
    errorMessage: string | null;
}

export interface Pricing extends BaseEntity {
    productId: EntityId;
    currentPrice: number;
    minPrice: number;
    maxPrice: number;
    targetMargin: number;
    isDynamic: boolean;
    currency: string;
}

export interface Competitor extends BaseEntity {
    productId: EntityId;
    competitorName: string;
    price: number;
    shippingCost: number;
    totalPrice: number;
    lastCheckedAt: Date;
}

export interface Image extends BaseEntity {
    productId: EntityId;
    url: string;
    type: 'RAW' | 'PROCESSED' | 'AI_GENERATED';
    isMain: boolean;
    aiMetadata: Record<string, any> | null;
}

export interface AIContent extends BaseEntity {
    productId: EntityId;
    generatedTitle: string;
    generatedDescription: string;
    keywords: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    promptUsed: string | null;
}

export interface Integration extends BaseEntity {
    name: 'WEDROP' | 'AMAZON' | 'BLING';
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    credentials: Record<string, any>;
    lastSyncAt: Date | null;
}

export interface AutomationJob extends BaseEntity {
    name: string;
    scheduleCron: string;
    type: string;
    status: 'ACTIVE' | 'PAUSED';
    lastRunAt: Date | null;
    nextRunAt: Date | null;
}

export interface SyncHistory extends BaseEntity {
    integrationId: EntityId;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    recordsProcessed: number;
    errors: string[] | null;
    startedAt: Date;
    completedAt: Date | null;
}

export interface Log extends BaseEntity {
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    context: Record<string, any> | null;
    source: string;
}

export interface UserSettings extends BaseEntity {
    userId: EntityId;
    preferences: Record<string, any>;
    theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    notificationsEnabled: boolean;
}
