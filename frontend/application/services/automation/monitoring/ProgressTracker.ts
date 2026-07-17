import { JobContext, GlobalState } from '../types';
import { IQueueRepository } from '../../../../domain/repositories';

export class ProgressTracker {
    private currentContext: JobContext = { jobId: 'default' };

    constructor(private queueRepo: IQueueRepository) {}

    updateContext(updates: Partial<JobContext>): void {
        this.currentContext = { ...this.currentContext, ...updates };
    }

    getContext(): JobContext {
        return this.currentContext;
    }

    async saveCheckpoint(queueId: string, step: GlobalState, payloadData: any): Promise<void> {
        // Persist the exact step and data to the database so we can resume
        await this.queueRepo.update(queueId, {
            status: 'PROCESSING',
            payload: {
                ...payloadData,
                resumeFromStep: step
            }
        });
    }

    async markCompleted(queueId: string): Promise<void> {
        await this.queueRepo.update(queueId, {
            status: 'COMPLETED',
            lastAttemptAt: new Date()
        });
    }

    async markFailed(queueId: string, errorMessage: string): Promise<void> {
        await this.queueRepo.update(queueId, {
            status: 'FAILED',
            errorMessage,
            lastAttemptAt: new Date()
        });
    }
}
