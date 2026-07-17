import { JobController } from './controllers/JobController';
import { HealthMonitor } from './monitoring/HealthMonitor';
import { StateMachine } from './core/StateMachine';

export class Scheduler {
    private intervalId: any = null;

    constructor(
        private jobController: JobController,
        private healthMonitor: HealthMonitor,
        private stateMachine: StateMachine
    ) {}

    startSchedule(intervalMs: number = 60000 * 60): void { // Default 1 hour
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(async () => {
            const currentState = this.stateMachine.getCurrentState();
            
            if (currentState === 'IDLE' || currentState === 'PAUSED') {
                const isHealthy = await this.healthMonitor.checkAllSystems();
                if (isHealthy) {
                    // If it was paused due to infrastructure, and now it's healthy, resume.
                    this.stateMachine.transitionTo('INITIALIZING');
                    this.jobController.start();
                }
            }
        }, intervalMs);
    }

    stopSchedule(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
