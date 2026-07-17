import { IWedropAuthenticationProvider, WedropSession, ICookieManager, ConnectionState } from '../types';
import { CredentialManager } from './CredentialManager';

export class SessionManager {
    private currentSession: WedropSession | null = null;
    private isReconnecting: boolean = false;

    constructor(
        private authProvider: IWedropAuthenticationProvider,
        private cookieManager: ICookieManager,
        private credentialManager: CredentialManager
    ) {}

    async login(email: string, password: string, keepConnected: boolean): Promise<WedropSession> {
        // Never log the password
        console.log(`[SessionManager] Initiating login for user: ${email}`);
        
        await this.credentialManager.saveCredentials(email, password, keepConnected);
        
        const session = await this.authProvider.login(email, password);
        this.currentSession = session;
        
        if (keepConnected) {
            await this.credentialManager.saveSession(session);
        }
        
        return session;
    }

    async getConnectionState(): Promise<ConnectionState> {
        if (this.isReconnecting) return 'RECONNECTING';

        if (this.currentSession) {
            const isValid = await this.authProvider.validateSession(this.currentSession);
            return isValid ? 'CONNECTED' : 'EXPIRED';
        }

        const storedSession = await this.credentialManager.getSession();
        if (storedSession) {
            const isValid = await this.authProvider.validateSession(storedSession);
            return isValid ? 'CONNECTED' : 'EXPIRED';
        }

        return 'DISCONNECTED';
    }

    async getActiveSession(): Promise<WedropSession> {
        // 1. Check memory
        if (this.currentSession && await this.authProvider.validateSession(this.currentSession)) {
            return this.currentSession;
        }

        // 2. Check storage
        const storedSession = await this.credentialManager.getSession();
        if (storedSession) {
            const isValid = await this.authProvider.validateSession(storedSession);
            if (isValid) {
                this.currentSession = storedSession;
                return storedSession;
            } else {
                // 3. Try Refresh
                try {
                    this.isReconnecting = true;
                    const refreshedSession = await this.authProvider.refreshSession(storedSession);
                    this.currentSession = refreshedSession;
                    await this.credentialManager.saveSession(refreshedSession);
                    this.isReconnecting = false;
                    return refreshedSession;
                } catch (e) {
                    this.isReconnecting = false;
                    console.warn("[SessionManager] Failed to refresh session.");
                }
            }
        }

        // 4. Try Auto Login
        return await this.autoLogin();
    }

    private async autoLogin(): Promise<WedropSession> {
        this.isReconnecting = true;
        try {
            const creds = await this.credentialManager.getCredentials();
            if (creds.email && creds.password && creds.keepConnected) {
                console.log("[SessionManager] Executing Auto Login...");
                const session = await this.login(creds.email, creds.password, creds.keepConnected);
                this.isReconnecting = false;
                return session;
            }
            throw new Error("Sessão expirada e credenciais não disponíveis para auto-login. Por favor, faça login novamente.");
        } catch (error) {
            this.isReconnecting = false;
            throw error;
        }
    }

    getFormattedCookies(): string {
        if (!this.currentSession) return '';
        return this.cookieManager.formatCookies(this.currentSession.cookies);
    }
}
