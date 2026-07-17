import { ICookieManager } from '../types';

export class CookieManager implements ICookieManager {
    private storedCookies: string[] = [];

    parseCookies(cookieHeader: string): string[] {
        // In a real Node.js environment, this would parse 'set-cookie' headers
        const cookies = cookieHeader.split(',').map(c => c.trim());
        this.storedCookies = [...this.storedCookies, ...cookies];
        return this.storedCookies;
    }

    formatCookies(cookies: string[]): string {
        // Formats cookies for the 'Cookie' header in subsequent requests
        return cookies.join('; ');
    }

    clearCookies(): void {
        this.storedCookies = [];
    }
}
