export type GlobalState = 
    | 'IDLE' 
    | 'INITIALIZING' 
    | 'AUTHENTICATING' 
    | 'FETCHING_PRODUCTS' 
    | 'QUEUEING' 
    | 'PROCESSING' 
    | 'GENERATING_AI' 
    | 'GENERATING_IMAGES' 
    | 'CALCULATING_PRICE' 
    | 'PUBLISHING' 
    | 'VALIDATING' 
    | 'SYNCING' 
    | 'COMPLETED' 
    | 'PAUSED' 
    | 'WAITING_USER' 
    | 'ERROR';

export type ExceptionCategory = 
    | 'CAPTCHA' 
    | 'TWO_FACTOR_AUTH' 
    | 'WEDROP_DOWN' 
    | 'AMAZON_DOWN' 
    | 'BLING_DOWN' 
    | 'CONNECTION_LOSS' 
    | 'AI_FAILURE' 
    | 'TIMEOUT' 
    | 'UNKNOWN';

export interface AutomationEvent {
    type: string;
    state: GlobalState;
    timestamp: Date;
    payload?: any;
}

export interface JobContext {
    jobId: string;
    currentBatchId?: string;
    currentItemSku?: string;
    resumeFromStep?: GlobalState;
}

export interface IEventDispatcher {
    dispatch(event: AutomationEvent): void;
    subscribe(eventType: string, callback: (event: AutomationEvent) => void): void;
}
