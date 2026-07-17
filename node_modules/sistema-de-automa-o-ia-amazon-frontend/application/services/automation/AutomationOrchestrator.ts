import { EventDispatcher } from './core/EventDispatcher';
import { StateMachine } from './core/StateMachine';
import { ExceptionHandler } from './core/ExceptionHandler';
import { RetryEngine } from './core/RetryEngine';
import { HealthMonitor } from './monitoring/HealthMonitor';
import { ProgressTracker } from './monitoring/ProgressTracker';
import { QueueManager } from './managers/QueueManager';
import { WorkflowEngine } from './engines/WorkflowEngine';
import { JobController } from './controllers/JobController';
import { Scheduler } from './Scheduler';

// Repositories
import { IQueueRepository, ILogRepository } from '../../../domain/repositories';

// Sub-modules
import { WedropSyncManager } from '../wedrop/WedropSyncManager';
import { AIListingEngine } from '../ai/AIListingEngine';
import { PricingEngine } from '../pricing/PricingEngine';
import { ImageIntelligenceEngine } from '../images/ImageIntelligenceEngine';
import { AmazonPublisherService } from '../amazon/AmazonPublisherService';
import { BlingIntegrationService } from '../bling/BlingIntegrationService';

export class AutomationOrchestrator {
    private dispatcher: EventDispatcher;
    private stateMachine: StateMachine;
    private exceptionHandler: ExceptionHandler;
    private retryEngine: RetryEngine;
    private healthMonitor: HealthMonitor;
    private progressTracker: ProgressTracker;
    private queueManager: QueueManager;
    private workflowEngine: WorkflowEngine;
    private jobController: JobController;
    private scheduler: Scheduler;

    constructor(
        queueRepo: IQueueRepository,
        logRepo: ILogRepository,
        wedropSyncManager: WedropSyncManager,
        aiEngine: AIListingEngine,
        pricingEngine: PricingEngine,
        imageEngine: ImageIntelligenceEngine,
        amazonPublisher: AmazonPublisherService,
        blingIntegration: BlingIntegrationService
    ) {
        // 1. Core Infrastructure
        this.dispatcher = new EventDispatcher();
        this.stateMachine = new StateMachine(this.dispatcher);
        this.exceptionHandler = new ExceptionHandler(this.stateMachine, logRepo);
        this.retryEngine = new RetryEngine(this.stateMachine);
        
        // 2. Monitoring & Tracking
        this.healthMonitor = new HealthMonitor(this.dispatcher);
        this.progressTracker = new ProgressTracker(queueRepo);
        
        // 3. Managers & Engines
        this.queueManager = new QueueManager(queueRepo);
        this.workflowEngine = new WorkflowEngine(
            this.stateMachine,
            this.progressTracker,
            this.retryEngine,
            aiEngine,
            pricingEngine,
            imageEngine,
            amazonPublisher,
            blingIntegration
        );

        // 4. Controllers
        this.jobController = new JobController(
            this.stateMachine,
            this.queueManager,
            this.workflowEngine,
            this.progressTracker,
            this.exceptionHandler,
            wedropSyncManager
        );

        // 5. Scheduler
        this.scheduler = new Scheduler(this.jobController, this.healthMonitor, this.stateMachine);

        this.setupGlobalListeners();
    }

    private setupGlobalListeners(): void {
        this.dispatcher.subscribe('STATE_CHANGED', (event) => {
            console.log(`[ORCHESTRATOR] State changed to: ${event.state}`, event.payload);
        });
    }

    /**
     * Starts the autonomous engine. It will run continuously in the background.
     */
    async boot(): Promise<void> {
        this.stateMachine.transitionTo('INITIALIZING');
        
        // Step 1: Verify authentications and health
        this.stateMachine.transitionTo('AUTHENTICATING');
        const isHealthy = await this.healthMonitor.checkAllSystems();
        
        if (!isHealthy) {
            this.stateMachine.transitionTo('PAUSED', { reason: 'Initial health check failed.' });
            // Start scheduler anyway so it can resume when healthy
            this.scheduler.startSchedule();
            return;
        }

        // Start the main job loop
        this.jobController.start();
        
        // Start the background scheduler to keep the system running continuously
        this.scheduler.startSchedule();
    }

    /**
     * Manually pauses the engine.
     */
    pause(): void {
        this.stateMachine.transitionTo('PAUSED', { reason: 'Manual intervention' });
        this.jobController.stop();
    }

    /**
     * Manually resumes the engine.
     */
    resume(): void {
        if (this.stateMachine.isPausedOrWaiting()) {
            this.stateMachine.transitionTo('INITIALIZING');
            this.jobController.start();
        }
    }

    getCurrentState() {
        return this.stateMachine.getCurrentState();
    }
}
