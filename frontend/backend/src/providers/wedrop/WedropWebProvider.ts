import { IntegrationRepository } from '../../repositories/IntegrationRepository';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// UTILITIES & MANAGERS
// ============================================================================

class RPALogger {
    static info(msg: string) { console.log(`[Wedrop RPA][INFO] ${msg}`); }
    static error(msg: string, err?: any) { console.error(`[Wedrop RPA][ERROR] ${msg}`, err || ''); }
    static warn(msg: string) { console.warn(`[Wedrop RPA][WARN] ${msg}`); }
    
    static async takeErrorScreenshot(page: Page, contextName: string) {
        try {
            const logsDir = path.join(process.cwd(), 'logs', 'screenshots');
            if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
            const filePath = path.join(logsDir, `error_${contextName}_${Date.now()}.png`);
            await page.screenshot({ path: filePath, fullPage: true });
            this.info(`Screenshot salvo em: ${filePath}`);
        } catch (e) {
            this.error('Falha ao salvar screenshot de erro.', e);
        }
    }
}

class CookieManager {
    private storedCookies: string[] = [];
    parseCookies(cookieHeader: string): string[] {
        const cookies = cookieHeader.split(',').map(c => c.trim());
        this.storedCookies = [...this.storedCookies, ...cookies];
        return this.storedCookies;
    }
    formatCookies(cookies: string[]): string { return cookies.join('; '); }
}

class CredentialManager {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(private integrationRepo: IntegrationRepository) {
        const envKey = process.env.ENCRYPTION_KEY || 'default_secure_key_32_bytes_long!';
        this.key = crypto.scryptSync(envKey, 'salt', 32);
    }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    private decrypt(hash: string): string {
        const parts = hash.split(':');
        if (parts.length !== 3) return Buffer.from(hash, 'base64').toString('utf-8'); // Fallback for old base64
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    async saveCredentials(email: string, password: string, keepConnected: boolean): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            await this.integrationRepo.update(integration.id, {
                credentials: { ...integration.credentials, email, passwordHash: this.encrypt(password), keepConnected }
            });
        }
    }

    async getCredentials(): Promise<any> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration && integration.credentials) {
            return {
                email: integration.credentials.email,
                password: integration.credentials.passwordHash ? this.decrypt(integration.credentials.passwordHash) : undefined,
                keepConnected: integration.credentials.keepConnected
            };
        }
        return {};
    }

    async saveSession(session: any): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            await this.integrationRepo.update(integration.id, { credentials: { ...integration.credentials, session } });
        }
    }

    async getSession(): Promise<any> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        return integration?.credentials?.session || null;
    }

    async clearSession(): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            await this.integrationRepo.update(integration.id, { credentials: {} });
        }
    }
}

// ============================================================================
// RPA AUTHENTICATION PROVIDER
// ============================================================================

class WedropAuthenticationProvider {
    private readonly LOGIN_URL = 'https://wedrop.com.br/login';
    private readonly DASHBOARD_URL = 'https://wedrop.com.br/dashboard';

    private get isDebugMode(): boolean {
        return process.env.NODE_ENV !== 'production';
    }

    async login(email: string, password: string): Promise<any> {
        RPALogger.info(`Iniciando navegador para login (Modo: ${this.isDebugMode ? 'Debug' : 'Produção'})...`);
        const browser = await chromium.launch({ headless: !this.isDebugMode });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        try {
            await page.goto(this.LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

            const hasCaptcha = await page.locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"]').count() > 0;
            if (hasCaptcha) {
                throw new Error("CAPTCHA detectado na página de login. Intervenção manual necessária.");
            }

            RPALogger.info('Preenchendo credenciais...');
            await page.fill('input[type="email"], input[name="email"], #email', email);
            await page.fill('input[type="password"], input[name="password"], #password', password);
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
                page.click('button[type="submit"], #btnLogin, .btn-login')
            ]);

            const isError = await page.locator('.alert-danger, .error-message, .toast-error').count() > 0;
            if (isError) {
                throw new Error("Credenciais inválidas ou erro retornado pelo painel da Wedrop.");
            }

            RPALogger.info('Login bem-sucedido. Extraindo estado da sessão...');
            const storageState = await context.storageState();

            return { 
                cookies: storageState.cookies.map(c => `${c.name}=${c.value}`), 
                token: JSON.stringify(storageState),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), 
                isValid: true 
            };

        } catch (error: any) {
            await RPALogger.takeErrorScreenshot(page, 'login');
            throw error;
        } finally {
            await browser.close();
        }
    }

    async validateSession(session: any): Promise<boolean> {
        if (!session || !session.token) return false;
        if (Date.now() > session.expiresAt) return false;

        RPALogger.info('Validando sessão ativa via RPA...');
        const browser = await chromium.launch({ headless: !this.isDebugMode });
        
        try {
            const storageState = JSON.parse(session.token);
            const context = await browser.newContext({ storageState });
            const page = await context.newPage();
            
            await page.goto(this.DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            const currentUrl = page.url();
            const isValid = !currentUrl.includes('login');
            
            return isValid;
        } catch (error) {
            RPALogger.warn('Falha ao validar sessão (Timeout ou erro de rede). Assumindo inválida.');
            return false;
        } finally {
            await browser.close();
        }
    }
}

// ============================================================================
// SESSION MANAGER
// ============================================================================

export class SessionManager {
    private currentSession: any = null;
    private isReconnecting: boolean = false;

    constructor(
        private authProvider: WedropAuthenticationProvider,
        private cookieManager: CookieManager,
        private credentialManager: CredentialManager
    ) {}

    async login(email: string, password: string, keepConnected: boolean): Promise<any> {
        await this.credentialManager.saveCredentials(email, password, keepConnected);
        const session = await this.authProvider.login(email, password);
        this.currentSession = session;
        if (keepConnected) await this.credentialManager.saveSession(session);
        return session;
    }

    async getConnectionState(): Promise<string> {
        if (this.isReconnecting) return 'RECONNECTING';
        if (this.currentSession && await this.authProvider.validateSession(this.currentSession)) return 'CONNECTED';
        const storedSession = await this.credentialManager.getSession();
        if (storedSession && await this.authProvider.validateSession(storedSession)) return 'CONNECTED';
        return 'DISCONNECTED';
    }

    async getActiveSession(): Promise<any> {
        if (this.currentSession && await this.authProvider.validateSession(this.currentSession)) return this.currentSession;
        const storedSession = await this.credentialManager.getSession();
        if (storedSession) {
            if (await this.authProvider.validateSession(storedSession)) {
                this.currentSession = storedSession;
                return storedSession;
            }
        }
        return await this.autoLogin();
    }

    async autoLogin(): Promise<any> {
        this.isReconnecting = true;
        try {
            const creds = await this.credentialManager.getCredentials();
            if (creds.email && creds.password && creds.keepConnected) {
                RPALogger.info('Executando Auto-Login...');
                const session = await this.login(creds.email, creds.password, creds.keepConnected);
                this.isReconnecting = false;
                return session;
            }
            throw new Error("Sessão expirada e credenciais não disponíveis para auto-login.");
        } catch (error) {
            this.isReconnecting = false;
            throw error;
        }
    }

    async logout(): Promise<void> {
        this.currentSession = null;
        await this.credentialManager.clearSession();
        RPALogger.info('Logout efetuado. Sessão e credenciais limpas.');
    }
}

// ============================================================================
// MAIN WEDROP WEB PROVIDER (RPA SCRAPER)
// ============================================================================

export class WedropWebProvider {
    private readonly BASE_URL = 'https://wedrop.com.br';
    private readonly PRODUCTS_URL = `${this.BASE_URL}/produtos`;
    private readonly CATEGORIES_URL = `${this.BASE_URL}/categorias`;

    private get isDebugMode(): boolean {
        return process.env.NODE_ENV !== 'production';
    }

    constructor(private sessionManager: SessionManager) {}

    // --- Existing Interface Methods ---
    async authenticate(email: string, password: string, keepConnected: boolean): Promise<void> {
        await this.login(email, password, keepConnected);
    }

    async checkConnection(): Promise<string> {
        return await this.sessionManager.getConnectionState();
    }

    // --- New Explicit Methods ---
    async login(email: string, password: string, keepConnected: boolean = true): Promise<void> {
        await this.sessionManager.login(email, password, keepConnected);
    }

    async isLogged(): Promise<boolean> {
        const state = await this.sessionManager.getConnectionState();
        return state === 'CONNECTED';
    }

    async refreshSession(): Promise<void> {
        await this.sessionManager.autoLogin();
    }

    async logout(): Promise<void> {
        await this.sessionManager.logout();
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 1;
        while (attempt <= maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                if (attempt === maxRetries) throw error;
                RPALogger.warn(`Erro transiente. Tentando novamente (Tentativa ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, 2000 * attempt));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }

    async getProducts(pageNumber: number, limit: number = 50): Promise<any> {
        return this.executeWithRetry(async () => {
            RPALogger.info(`Iniciando extração de produtos (Página ${pageNumber})...`);
            
            const session = await this.sessionManager.getActiveSession();
            const storageState = JSON.parse(session.token);

            const browser = await chromium.launch({ headless: !this.isDebugMode });
            const context = await browser.newContext({ storageState });
            const page = await context.newPage();

            try {
                const targetUrl = `${this.PRODUCTS_URL}?page=${pageNumber}&limit=${limit}`;
                await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

                const isOffline = await page.locator('.offline-message, #error-page').count() > 0;
                if (isOffline) throw new Error("Perda de conexão ou página indisponível.");

                RPALogger.info('Avaliando DOM e extraindo dados...');
                
                const extractedData = await page.evaluate(() => {
                    const productRows = document.querySelectorAll('.product-item, tr.product-row');
                    const products: any[] = [];

                    productRows.forEach(row => {
                        try {
                            // Non-blocking extraction per row
                            const sku = row.querySelector('.sku, [data-sku]')?.textContent?.trim() || '';
                            const title = row.querySelector('.title, .product-name')?.textContent?.trim() || '';
                            const description = row.querySelector('.description')?.textContent?.trim() || '';
                            const category = row.querySelector('.category')?.textContent?.trim() || 'Geral';
                            const brand = row.querySelector('.brand')?.textContent?.trim() || 'Genérico';
                            
                            const priceText = row.querySelector('.price, .valor')?.textContent?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0';
                            const price = parseFloat(priceText);
                            
                            const stockText = row.querySelector('.stock, .estoque')?.textContent?.replace(/\D/g, '') || '0';
                            const stock = parseInt(stockText, 10);

                            const imgElements = row.querySelectorAll('img.product-img, .gallery img');
                            const images = Array.from(imgElements).map(img => (img as HTMLImageElement).src).filter(src => src);

                            const attributes: Record<string, string> = {};
                            const attrElements = row.querySelectorAll('.attribute');
                            attrElements.forEach(attr => {
                                const key = attr.getAttribute('data-key') || attr.querySelector('.key')?.textContent?.trim() || '';
                                const val = attr.getAttribute('data-value') || attr.querySelector('.value')?.textContent?.trim() || '';
                                if (key && val) attributes[key] = val;
                            });

                            const weight = parseFloat(row.querySelector('.weight')?.textContent?.replace(/[^\d.]/g, '') || '0.5');
                            const dimensions = {
                                length: parseFloat(row.querySelector('.length')?.textContent?.replace(/[^\d.]/g, '') || '10'),
                                width: parseFloat(row.querySelector('.width')?.textContent?.replace(/[^\d.]/g, '') || '10'),
                                height: parseFloat(row.querySelector('.height')?.textContent?.replace(/[^\d.]/g, '') || '10')
                            };

                            const status = row.querySelector('.status-badge')?.textContent?.trim().toLowerCase() || 'não publicado';
                            const isPublished = status.includes('publicado') && !status.includes('não');

                            if (sku && title) {
                                products.push({
                                    sku, title, description, category, brand, price, weight, dimensions, attributes, stock, images, isPublished
                                });
                            }
                        } catch (e) {
                            console.error('Erro ao extrair linha de produto', e);
                        }
                    });

                    const totalText = document.querySelector('.total-items, .pagination-info')?.textContent?.replace(/\D/g, '') || '0';
                    const total = parseInt(totalText, 10) || products.length;
                    const totalPages = Math.ceil(total / 50) || 1;

                    return { products, total, totalPages };
                });

                RPALogger.info(`Extraídos ${extractedData.products.length} produtos da página ${pageNumber}.`);

                // Apply Filters (Unpublished & Price <= 200)
                const filteredProducts = extractedData.products.filter(p => !p.isPublished && p.price <= 200.00);
                
                RPALogger.info(`Após filtros (Não publicados, <= R$200): ${filteredProducts.length} produtos restantes.`);

                return {
                    data: filteredProducts,
                    total: extractedData.total,
                    page: pageNumber,
                    totalPages: extractedData.totalPages
                };

            } catch (error: any) {
                await RPALogger.takeErrorScreenshot(page, `getProducts_page_${pageNumber}`);
                throw error;
            } finally {
                await browser.close();
            }
        });
    }

    async getProduct(id: string): Promise<any> {
        return this.executeWithRetry(async () => {
            RPALogger.info(`Extraindo detalhes do produto ID/SKU: ${id}...`);
            const session = await this.sessionManager.getActiveSession();
            const storageState = JSON.parse(session.token);

            const browser = await chromium.launch({ headless: !this.isDebugMode });
            const context = await browser.newContext({ storageState });
            const page = await context.newPage();

            try {
                await page.goto(`${this.PRODUCTS_URL}/${id}`, { waitUntil: 'networkidle', timeout: 30000 });
                
                const productData = await page.evaluate(() => {
                    // Placeholder selectors for single product page
                    const sku = document.querySelector('.sku')?.textContent?.trim() || '';
                    const title = document.querySelector('.title')?.textContent?.trim() || '';
                    const description = document.querySelector('.description')?.textContent?.trim() || '';
                    const price = parseFloat(document.querySelector('.price')?.textContent?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
                    
                    return { sku, title, description, price };
                });

                return productData;
            } catch (error: any) {
                await RPALogger.takeErrorScreenshot(page, `getProduct_${id}`);
                throw error;
            } finally {
                await browser.close();
            }
        });
    }

    async getCategories(): Promise<string[]> {
        return this.executeWithRetry(async () => {
            RPALogger.info(`Extraindo categorias...`);
            const session = await this.sessionManager.getActiveSession();
            const storageState = JSON.parse(session.token);

            const browser = await chromium.launch({ headless: !this.isDebugMode });
            const context = await browser.newContext({ storageState });
            const page = await context.newPage();

            try {
                await page.goto(this.CATEGORIES_URL, { waitUntil: 'networkidle', timeout: 30000 });
                
                const categories = await page.evaluate(() => {
                    const items = document.querySelectorAll('.category-item');
                    return Array.from(items).map(item => item.textContent?.trim() || '').filter(c => c);
                });

                return categories;
            } catch (error: any) {
                await RPALogger.takeErrorScreenshot(page, `getCategories`);
                throw error;
            } finally {
                await browser.close();
            }
        });
    }

    async downloadImages(urls: string[]): Promise<Record<string, string>> {
        RPALogger.info(`Iniciando download físico de ${urls.length} imagens...`);
        const session = await this.sessionManager.getActiveSession();
        const storageState = JSON.parse(session.token);

        const browser = await chromium.launch({ headless: true }); // Always headless for downloads
        const context = await browser.newContext({ storageState });
        
        const results: Record<string, string> = {};
        
        try {
            for (const url of urls) {
                try {
                    // Use Playwright's request context to ensure session cookies are sent
                    const response = await context.request.get(url, { timeout: 15000 });
                    if (response.ok()) {
                        const buffer = await response.body();
                        const mimeType = response.headers()['content-type'] || 'image/jpeg';
                        results[url] = `data:${mimeType};base64,${buffer.toString('base64')}`;
                        RPALogger.info(`Imagem baixada com sucesso: ${url}`);
                    } else {
                        RPALogger.warn(`Falha ao baixar imagem (Status ${response.status()}): ${url}`);
                    }
                } catch (e) {
                    RPALogger.error(`Erro de rede ao baixar imagem: ${url}`, e);
                }
            }
        } finally {
            await browser.close();
        }
        
        return results;
    }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

const integrationRepo = new IntegrationRepository();
const cookieManager = new CookieManager();
const credentialManager = new CredentialManager(integrationRepo);
const authProvider = new WedropAuthenticationProvider();
const sessionManager = new SessionManager(authProvider, cookieManager, credentialManager);

export const wedropProviderInstance = new WedropWebProvider(sessionManager);
