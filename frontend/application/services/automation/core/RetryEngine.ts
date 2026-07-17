import { StateMachine } from './StateMachine';

export class RetryEngine {
    constructor(private stateMachine: StateMachine) {}

    async execute<T>(operationName: string, operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 1;

        while (attempt <= maxRetries) {
            // If the system was paused globally, wait before continuing the retry loop
            while (this.stateMachine.isPausedOrWaiting()) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            try {
                return await operation();
            } catch (error: any) {
                if (attempt === maxRetries) {
                    throw error; // Bubble up to ExceptionHandler
                }

                const delay = 2000 * Math.pow(2, attempt - 1);
                console.warn(`[RetryEngine] ${operationName} failed. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }
}
