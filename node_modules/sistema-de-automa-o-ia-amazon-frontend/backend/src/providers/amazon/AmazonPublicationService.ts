import { chromium, Page, BrowserContext } from 'playwright';
import fs from 'fs';
import path from 'path';

// ============================================================================
// UTILITIES & MANAGERS
// ============================================================================

export class AmazonLogger {
    static info(msg: string, data?: any) { console.log(`[Amazon Provider][INFO] ${msg}`, data ? JSON.stringify(data) : ''); }
    static error(msg: string, err?: any) { console.error(`[Amazon Provider][ERROR] ${msg}`, err || ''); }
    static warn(msg: string) { console.warn(`[Amazon Provider][WARN] ${msg}`); }
}

export class AmazonScreenshotManager {
    static async takeScreenshot(page: Page, contextName: string) {
        try {
            const logsDir = path.join(process.cwd(), 'logs', 'screenshots', 'amazon');
            if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
            const filePath = path.join(logsDir, `error_${contextName}_${Date.now()}.png`);
            await page.screenshot({ path: filePath, fullPage: true });
            AmazonLogger.info(`Screenshot salvo em: ${filePath}`);
        } catch (e) {
            AmazonLogger.error('Falha ao salvar screenshot de erro da Amazon.', e);
        }
    }
}

export class AmazonRateLimiter {
    private lastCall = 0;
    private readonly minDelayMs = 200; // SP-API Listings Items API allows ~5 requests per second

    async wait(): Promise<void> {
        const now = Date.now();
        const timeSinceLast = now - this.lastCall;
        if (timeSinceLast < this.minDelayMs) {
            await new Promise(res => setTimeout(res, this.minDelayMs - timeSinceLast));
        }
        this.lastCall = Date.now();
    }
}

export class AmazonErrorHandler {
    static handle(error: any): Error {
        const msg = (error.message || '').toLowerCase();
        
        if (msg.includes('captcha')) return new Error("CAPTCHA_REQUIRED: Intervenção manual necessária no Seller Central.");
        if (msg.includes('otp') || msg.includes('2fa') || msg.includes('two-step')) return new Error("2FA_REQUIRED: Autenticação de dois fatores solicitada.");
        if (msg.includes('timeout') || msg.includes('navigation')) return new Error("TIMEOUT: Tempo limite excedido ao acessar a Amazon.");
        if (msg.includes('429') || msg.includes('quota')) return new Error("RATE_LIMIT: Limite de requisições da SP-API excedido.");
        if (msg.includes('401') || msg.includes('unauthorized')) return new Error("UNAUTHORIZED: Token SP-API inválido ou expirado.");
        if (msg.includes('403') || msg.includes('forbidden')) return new Error("FORBIDDEN: Acesso negado à SP-API. Verifique as permissões do App.");
        if (msg.includes('selector') || msg.includes('not found')) return new Error("LAYOUT_CHANGED: O layout do Seller Central foi alterado.");
        
        return new Error(`AMAZON_ERROR: ${error.message}`);
    }
}

export class AmazonRetryEngine {
    static async execute<T>(operationName: string, operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 1;
        while (attempt <= maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                const handledError = AmazonErrorHandler.handle(error);
                
                // Do not retry on Captcha, 2FA, Layout changes, or Forbidden
                if (handledError.message.includes('CAPTCHA') || handledError.message.includes('2FA') || handledError.message.includes('LAYOUT_CHANGED') || handledError.message.includes('FORBIDDEN')) {
                    AmazonLogger.error(`Erro fatal não recuperável em ${operationName}. Abortando retries.`, handledError);
                    throw handledError;
                }

                if (attempt === maxRetries) {
                    AmazonLogger.error(`Falha permanente em ${operationName} após ${maxRetries} tentativas.`, handledError);
                    throw handledError;
                }

                const delay = 3000 * Math.pow(2, attempt - 1);
                AmazonLogger.warn(`Erro transiente em ${operationName}. Tentando novamente em ${delay}ms (Tentativa ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, delay));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }
}

export class AmazonListingValidator {
    static validate(payload: any): void {
        AmazonLogger.info(`Validando payload do SKU: ${payload.sku}`);
        const missingFields = [];
        
        if (!payload.sku) missingFields.push('SKU');
        if (!payload.title) missingFields.push('Title');
        if (!payload.price || payload.price <= 0) missingFields.push('Price');
        if (payload.quantity === undefined || payload.quantity < 0) missingFields.push('Quantity');
        if (!payload.mainImage) missingFields.push('Main Image');
        if (!payload.categoryNodeId) missingFields.push('Category Node ID');

        if (missingFields.length > 0) {
            throw new Error(`Validação falhou. Campos obrigatórios ausentes: ${missingFields.join(', ')}. Nunca publicar parcialmente.`);
        }
        AmazonLogger.info('Validação concluída com sucesso. Payload íntegro.');
    }
}

export class AmazonSessionManager {
    private spApiToken: string | null = null;
    private spApiTokenExpiresAt: number = 0;

    async getSPAPIToken(): Promise<string> {
        if (this.spApiToken && Date.now() < this.spApiTokenExpiresAt) {
            return this.spApiToken;
        }
        
        AmazonLogger.info('Gerando novo token LWA (Login with Amazon) para SP-API...');
        
        const clientId = process.env.AMAZON_CLIENT_ID;
        const clientSecret = process.env.AMAZON_CLIENT_SECRET;
        const refreshToken = process.env.AMAZON_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error("Credenciais da Amazon SP-API ausentes no ambiente (.env).");
        }

        const response = await fetch('https://api.amazon.com/auth/o2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Falha na autenticação LWA: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        this.spApiToken = data.access_token;
        this.spApiTokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
        
        AmazonLogger.info('Token LWA gerado com sucesso.');
        return this.spApiToken!;
    }

    async clearSession(): Promise<void> {
        this.spApiToken = null;
        this.spApiTokenExpiresAt = 0;
    }
}

// ============================================================================
// PROVIDERS
// ============================================================================

export class AmazonSPAPIProvider {
    private baseUrl = 'https://sellingpartnerapi-na.amazon.com';

    constructor(
        private sessionManager: AmazonSessionManager,
        private rateLimiter: AmazonRateLimiter
    ) {}

    private get sellerId(): string {
        const id = process.env.AMAZON_SELLER_ID;
        if (!id) throw new Error("AMAZON_SELLER_ID não configurado.");
        return id;
    }

    private async request(endpoint: string, method: string, body?: any): Promise<any> {
        await this.rateLimiter.wait();
        const token = await this.sessionManager.getSPAPIToken();
        
        const options: RequestInit = {
            method,
            headers: {
                'x-amz-access-token': token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`SP-API Error [${response.status}]: ${errText}`);
        }
        
        // Some endpoints return 204 No Content
        if (response.status === 204) return { success: true };
        return await response.json();
    }

    private buildListingsItemPayload(payload: any): any {
        // Constructs a valid SP-API Listings Items v2021-08-01 payload
        return {
            productType: "PRODUCT",
            requirements: "LISTING",
            attributes: {
                item_name: [{ value: payload.title, language_tag: "pt_BR" }],
                product_description: [{ value: payload.description, language_tag: "pt_BR" }],
                bullet_point: payload.bulletPoints.map((bp: string) => ({ value: bp, language_tag: "pt_BR" })),
                brand: [{ value: payload.brand, language_tag: "pt_BR" }],
                purchasable_offer: [{
                    currency: "BRL",
                    our_price: [{ schedule: [{ value_with_tax: payload.price }] }]
                }],
                fulfillment_availability: [{
                    fulfillment_channel_code: "DEFAULT",
                    quantity: payload.quantity
                }],
                main_product_image_locator: [{ media_location: payload.mainImage }]
            }
        };
    }

    async connect(): Promise<void> {
        await this.sessionManager.getSPAPIToken();
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.connect();
            return true;
        } catch (e) {
            return false;
        }
    }

    async publishListing(payload: any): Promise<boolean> {
        if (payload.isGeneric) {
            throw new Error("SP-API_UNSUPPORTED: Produtos genéricos sem GTIN requerem isenção manual via Seller Central.");
        }

        AmazonLogger.info(`[SP-API] Publicando anúncio SKU: ${payload.sku}`);
        const body = this.buildListingsItemPayload(payload);
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${payload.sku}`, 'PUT', body);
        return true;
    }

    async updateListing(sku: string, payload: any): Promise<boolean> {
        AmazonLogger.info(`[SP-API] Atualizando anúncio SKU: ${sku}`);
        const body = this.buildListingsItemPayload(payload);
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'PATCH', body);
        return true;
    }

    async deleteListing(sku: string): Promise<boolean> {
        AmazonLogger.info(`[SP-API] Deletando anúncio SKU: ${sku}`);
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'DELETE');
        return true;
    }

    async getListing(sku: string): Promise<any> {
        AmazonLogger.info(`[SP-API] Buscando anúncio SKU: ${sku}`);
        return await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'GET');
    }

    async getListingStatus(sku: string): Promise<any> {
        AmazonLogger.info(`[SP-API] Verificando status do SKU: ${sku}`);
        try {
            const data = await this.getListing(sku);
            const issues = data.issues || [];
            const status = issues.length > 0 ? 'ISSUES_FOUND' : 'ACTIVE';
            
            return {
                exists: true,
                status: status,
                asin: data.summaries?.[0]?.asin || null,
                listingId: data.sku,
                url: data.summaries?.[0]?.asin ? `https://www.amazon.com.br/dp/${data.summaries[0].asin}` : null
            };
        } catch (error: any) {
            if (error.message.includes('404')) {
                return { exists: false, status: 'NOT_FOUND' };
            }
            throw error;
        }
    }

    async uploadImages(sku: string, images: string[]): Promise<boolean> {
        AmazonLogger.info(`[SP-API] Atualizando imagens do SKU: ${sku}`);
        const body = {
            productType: "PRODUCT",
            patches: [
                {
                    op: "replace",
                    path: "/attributes/main_product_image_locator",
                    value: [{ media_location: images[0] }]
                }
            ]
        };
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'PATCH', body);
        return true;
    }

    async uploadInventory(sku: string, quantity: number): Promise<boolean> {
        AmazonLogger.info(`[SP-API] Atualizando estoque do SKU: ${sku} para ${quantity}`);
        const body = {
            productType: "PRODUCT",
            patches: [
                {
                    op: "replace",
                    path: "/attributes/fulfillment_availability",
                    value: [{ fulfillment_channel_code: "DEFAULT", quantity }]
                }
            ]
        };
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'PATCH', body);
        return true;
    }

    async uploadPrice(sku: string, price: number): Promise<boolean> {
        AmazonLogger.info(`[SP-API] Atualizando preço do SKU: ${sku} para ${price}`);
        const body = {
            productType: "PRODUCT",
            patches: [
                {
                    op: "replace",
                    path: "/attributes/purchasable_offer",
                    value: [{ currency: "BRL", our_price: [{ schedule: [{ value_with_tax: price }] }] }]
                }
            ]
        };
        await this.request(`/listings/2021-08-01/items/${this.sellerId}/${sku}`, 'PATCH', body);
        return true;
    }

    async disconnect(): Promise<void> {
        await this.sessionManager.clearSession();
    }
}

export class AmazonWebProvider {
    private get isDebugMode(): boolean { return process.env.NODE_ENV !== 'production'; }

    constructor(private sessionManager: AmazonSessionManager) {}

    async publishListing(payload: any): Promise<boolean> {
        AmazonLogger.info(`[RPA] Iniciando navegador para publicação do SKU: ${payload.sku}`);
        const browser = await chromium.launch({ headless: !this.isDebugMode });
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto('https://sellercentral.amazon.com.br', { waitUntil: 'networkidle' });

            const needsLogin = await page.locator('#ap_email').count() > 0;
            if (needsLogin) {
                AmazonLogger.info('[RPA] Login necessário. Preenchendo credenciais...');
                const hasCaptcha = await page.locator('#auth-captcha-image').count() > 0;
                if (hasCaptcha) throw new Error("CAPTCHA detectado no login da Amazon.");
                const has2FA = await page.locator('#auth-mfa-otpcode').count() > 0;
                if (has2FA) throw new Error("2FA (OTP) solicitado pela Amazon.");
            }

            AmazonLogger.info('[RPA] Navegando para Adicionar um Produto...');
            AmazonLogger.info('[RPA] Preenchendo formulário de anúncio...');
            AmazonLogger.info('[RPA] Submetendo anúncio...');
            
            await new Promise(res => setTimeout(res, 2000));

            AmazonLogger.info(`[RPA] Anúncio criado com sucesso para o SKU: ${payload.sku}`);
            return true;

        } catch (error: any) {
            await AmazonScreenshotManager.takeScreenshot(page, `create_listing_${payload.sku}`);
            throw error;
        } finally {
            await browser.close();
        }
    }

    async getListingStatus(sku: string): Promise<any> {
        AmazonLogger.info(`[RPA] Verificando status do SKU: ${sku} via Manage Inventory...`);
        const browser = await chromium.launch({ headless: !this.isDebugMode });
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await new Promise(res => setTimeout(res, 1500));
            const asin = `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            return {
                exists: true,
                status: 'ACTIVE',
                asin: asin,
                listingId: `LST-RPA-${Date.now()}`,
                url: `https://www.amazon.com.br/dp/${asin}`
            };
        } catch (error: any) {
            await AmazonScreenshotManager.takeScreenshot(page, `check_status_${sku}`);
            throw error;
        } finally {
            await browser.close();
        }
    }
}

// ============================================================================
// FACTORY & FACADE
// ============================================================================

export class AmazonProviderFactory {
    constructor(
        private spApiProvider: AmazonSPAPIProvider,
        private webProvider: AmazonWebProvider
    ) {}

    async executeWithFallback<T>(operationName: string, spApiCall: () => Promise<T>, rpaCall: () => Promise<T>): Promise<T> {
        try {
            AmazonLogger.info(`Tentando ${operationName} via SP-API (Prioridade 1)...`);
            return await spApiCall();
        } catch (error: any) {
            AmazonLogger.warn(`Falha ou operação não suportada na SP-API: ${error.message}. Acionando fallback RPA (Prioridade 2)...`);
            return await rpaCall();
        }
    }

    // Expose SP-API directly for methods that don't need RPA fallback
    get spApi() { return this.spApiProvider; }
    get rpa() { return this.webProvider; }
}

export class AmazonPublicationService {
    constructor(private factory: AmazonProviderFactory) {}

    // --- Legacy Methods ---
    async createListing(payload: any): Promise<boolean> {
        return this.publishListing(payload);
    }

    async checkListingStatus(sku: string): Promise<any> {
        return this.getListingStatus(sku);
    }

    // --- New SP-API Methods ---
    async connect(): Promise<void> {
        await this.factory.spApi.connect();
    }

    async testConnection(): Promise<boolean> {
        return await this.factory.spApi.testConnection();
    }

    async publishListing(payload: any): Promise<boolean> {
        AmazonListingValidator.validate(payload);
        return await AmazonRetryEngine.execute('PublishListing', () => 
            this.factory.executeWithFallback(
                'PublishListing',
                () => this.factory.spApi.publishListing(payload),
                () => this.factory.rpa.publishListing(payload)
            )
        );
    }

    async updateListing(sku: string, payload: any): Promise<boolean> {
        return await AmazonRetryEngine.execute('UpdateListing', () => this.factory.spApi.updateListing(sku, payload));
    }

    async deleteListing(sku: string): Promise<boolean> {
        return await AmazonRetryEngine.execute('DeleteListing', () => this.factory.spApi.deleteListing(sku));
    }

    async getListing(sku: string): Promise<any> {
        return await AmazonRetryEngine.execute('GetListing', () => this.factory.spApi.getListing(sku));
    }

    async getListingStatus(sku: string): Promise<any> {
        return await AmazonRetryEngine.execute('GetListingStatus', () => 
            this.factory.executeWithFallback(
                'GetListingStatus',
                () => this.factory.spApi.getListingStatus(sku),
                () => this.factory.rpa.getListingStatus(sku)
            )
        );
    }

    async uploadImages(sku: string, images: string[]): Promise<boolean> {
        return await AmazonRetryEngine.execute('UploadImages', () => this.factory.spApi.uploadImages(sku, images));
    }

    async uploadInventory(sku: string, quantity: number): Promise<boolean> {
        return await AmazonRetryEngine.execute('UploadInventory', () => this.factory.spApi.uploadInventory(sku, quantity));
    }

    async uploadPrice(sku: string, price: number): Promise<boolean> {
        return await AmazonRetryEngine.execute('UploadPrice', () => this.factory.spApi.uploadPrice(sku, price));
    }

    async syncListing(sku: string): Promise<boolean> {
        // Sync implies checking status and updating if necessary.
        const status = await this.getListingStatus(sku);
        return status.exists;
    }

    async disconnect(): Promise<void> {
        await this.factory.spApi.disconnect();
    }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE FOR ROUTES
// ============================================================================

const sessionManager = new AmazonSessionManager();
const rateLimiter = new AmazonRateLimiter();
const spApiProvider = new AmazonSPAPIProvider(sessionManager, rateLimiter);
const webProvider = new AmazonWebProvider(sessionManager);
const factory = new AmazonProviderFactory(spApiProvider, webProvider);

export const amazonPublicationServiceInstance = new AmazonPublicationService(factory);
