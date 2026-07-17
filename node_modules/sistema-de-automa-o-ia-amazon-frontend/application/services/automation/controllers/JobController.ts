import { StateMachine } from '../core/StateMachine';
import { QueueManager } from '../managers/QueueManager';
import { WorkflowEngine } from '../engines/WorkflowEngine';
import { ProgressTracker } from '../monitoring/ProgressTracker';
import { ExceptionHandler } from '../core/ExceptionHandler';
import { WedropSyncManager } from '../../wedrop/WedropSyncManager';

export class JobController {
    private isRunning = false;

    constructor(
        private stateMachine: StateMachine,
        private queueManager: QueueManager,
        private workflowEngine: WorkflowEngine,
        private progressTracker: ProgressTracker,
        private exceptionHandler: ExceptionHandler,
        private wedropSyncManager: WedropSyncManager
    ) {}

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            // Step 1-5: Fetch from Wedrop and populate queue
            this.stateMachine.transitionTo('FETCHING_PRODUCTS');
            await this.wedropSyncManager.executeSync();

            // Step 6: Process in batches
            while (this.isRunning) {
                if (this.stateMachine.isPausedOrWaiting()) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                this.stateMachine.transitionTo('QUEUEING');
                const batch = await this.queueManager.getNextBatch(1); // Fetch 1 queue item (which contains a batch of 10 products)

                if (batch.length === 0) {
                    this.stateMachine.transitionTo('IDLE');
                    this.isRunning = false;
                    break;
                }

                this.stateMachine.transitionTo('PROCESSING');
                
                for (const queueItem of batch) {
                    try {
                        const items = queueItem.payload.items || [];
                        const resumeStep = queueItem.payload.resumeFromStep || 'GENERATING_AI';

                        // Process the 10 products sequentially to ensure strict state tracking
                        for (const wedropProduct of items) {
                            this.progressTracker.updateContext({ currentItemSku: wedropProduct.sku });
                            await this.workflowEngine.processProduct(queueItem.id, wedropProduct, resumeStep);
                        }

                        await this.progressTracker.markCompleted(queueItem.id);

                    } catch (error: any) {
                        await this.exceptionHandler.handle(error, { queueId: queueItem.id });
                        if (!this.stateMachine.isPausedOrWaiting()) {
                            await this.progressTracker.markFailed(queueItem.id, error.message);
                        }
                    }
                }
            }
        } catch (error: any) {
            await this.exceptionHandler.handle(error, { context: 'JobController.start' });
            this.isRunning = false;
        }
    }

    stop(): void {
        this.isRunning = false;
        this.stateMachine.transitionTo('IDLE');
    }
}
