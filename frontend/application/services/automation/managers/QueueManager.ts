import { IQueueRepository } from '../../../../domain/repositories';
import { Queue } from '../../../../domain/entities';

export class QueueManager {
    constructor(private queueRepo: IQueueRepository) {}

    async getNextBatch(limit: number = 1): Promise<Queue[]> {
        // Fetch pending items
        const pendingItems = await this.queueRepo.findPending(limit);
        
        // Lock them for processing
        for (const item of pendingItems) {
            await this.queueRepo.markAsProcessing(item.id);
        }

        return pendingItems;
    }
}
