export class SyncLogger {
    logInfo(sku: string, message: string, context?: any): void {
        console.log(`[BLING INTEGRATION][INFO][${sku}] ${message}`, context ? JSON.stringify(context) : '');
    }

    logError(sku: string, message: string, error?: any): void {
        console.error(`[BLING INTEGRATION][ERROR][${sku}] ${message}`, error || '');
    }

    logSuccess(sku: string, message: string): void {
        console.log(`[BLING INTEGRATION][SUCCESS][${sku}] ${message}`);
    }

    logAttempt(sku: string, attemptNumber: number, maxAttempts: number): void {
        console.log(`[BLING INTEGRATION][ATTEMPT][${sku}] Attempt ${attemptNumber} of ${maxAttempts}`);
    }
}
