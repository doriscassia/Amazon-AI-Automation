export class PublicationLogger {
    logInfo(sku: string, message: string, context?: any): void {
        console.log(`[AMAZON PUBLISHER][INFO][${sku}] ${message}`, context ? JSON.stringify(context) : '');
    }

    logError(sku: string, message: string, error?: any): void {
        console.error(`[AMAZON PUBLISHER][ERROR][${sku}] ${message}`, error || '');
    }

    logSuccess(sku: string, message: string): void {
        console.log(`[AMAZON PUBLISHER][SUCCESS][${sku}] ${message}`);
    }

    logAttempt(sku: string, attemptNumber: number, maxAttempts: number): void {
        console.log(`[AMAZON PUBLISHER][ATTEMPT][${sku}] Attempt ${attemptNumber} of ${maxAttempts}`);
    }
}
