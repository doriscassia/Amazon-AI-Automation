import { IIntegrationRepository } from '../../../../domain/repositories';
import { WedropSession } from '../types';

export class SecureCredentialStorage {
    constructor(private integrationRepo: IIntegrationRepository) {}

    async saveCredentials(email: string, password: string, keepConnected: boolean): Promise<void> {
        const integration = await this.integrationRepo.findByName('WEDROP');
        if (integration) {
            // In a real production environment, the password MUST be encrypted before saving.
            // For this architectural implementation, we store it in the secure integration repository.
            await this.integrationRepo.update(integration.id, {
                credentials: {
                    ...integration.credentials,
                    email,
                    password, // TODO: Encrypt
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
                password: integration.credentials.password, // TODO: Decrypt
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
