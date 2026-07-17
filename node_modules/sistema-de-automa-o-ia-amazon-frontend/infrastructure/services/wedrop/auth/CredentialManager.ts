import { IIntegrationRepository } from '../../../../domain/repositories';
import { WedropSession } from '../types';

export class CredentialManager {
    constructor(private integrationRepo: IIntegrationRepository) {}

    /**
     * Simulates encryption. In a real Node.js environment, use crypto module (AES-256-GCM).
     * NEVER store plain text passwords.
     */
    private encrypt(text: string): string {
        return typeof btoa !== 'undefined' ? btoa(text) : Buffer.from(text).toString('base64');
    }

    private decrypt(hash: string): string {
        return typeof atob !== 'undefined' ? atob(hash) : Buffer.from(hash, 'base64').toString('utf-8');
    }

    async saveCredentials(email: string, password: string, keepConnected: boolean): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            await this.integrationRepo.update(integration.id, {
                credentials: {
                    ...integration.credentials,
                    email,
                    passwordHash: this.encrypt(password),
                    keepConnected
                }
            });
        }
    }

    async getCredentials(): Promise<{ email?: string; password?: string; keepConnected?: boolean }> {
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

    async saveSession(session: WedropSession): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            await this.integrationRepo.update(integration.id, {
                credentials: {
                    ...integration.credentials,
                    session
                }
            });
        }
    }

    async getSession(): Promise<WedropSession | null> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration && integration.credentials && integration.credentials.session) {
            return integration.credentials.session as WedropSession;
        }
        return null;
    }
}
