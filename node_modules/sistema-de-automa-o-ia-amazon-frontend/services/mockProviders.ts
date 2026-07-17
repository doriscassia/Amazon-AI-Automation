import { IMonitoringService } from '../types/domain';

// Infrastructure Layer: Concrete implementations of Domain interfaces.
// In a real scenario, these would make actual API calls.

export class MockMonitoringService implements IMonitoringService {
    logEvent(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
        console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }

    async getSystemHealth(): Promise<{ status: string; uptime: number }> {
        return Promise.resolve({ status: 'healthy', uptime: 99.9 });
    }
}

// Service Locator / Dependency Injection container (simplified for React context)
export const services = {
    monitoring: new MockMonitoringService(),
    // Add other mock services here as needed for UI development
};
