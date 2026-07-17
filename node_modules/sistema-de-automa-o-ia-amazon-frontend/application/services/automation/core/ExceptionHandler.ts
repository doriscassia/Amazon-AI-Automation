import { ExceptionCategory, GlobalState } from '../types';
import { StateMachine } from './StateMachine';
import { ILogRepository } from '../../../../domain/repositories';

export class ExceptionHandler {
    constructor(
        private stateMachine: StateMachine,
        private logRepo: ILogRepository
    ) {}

    async handle(error: any, context: any): Promise<void> {
        const category = this.categorizeError(error);
        
        await this.logRepo.create({
            level: 'ERROR',
            message: `Automation Exception: ${category} - ${error.message}`,
            source: 'AutonomousEngine',
            context: { ...context, stack: error.stack, category }
        });

        switch (category) {
            case 'CAPTCHA':
            case 'TWO_FACTOR_AUTH':
                // Requires human intervention. Save state and wait.
                this.stateMachine.transitionTo('WAITING_USER', { reason: category });
                break;
            
            case 'WEDROP_DOWN':
            case 'AMAZON_DOWN':
            case 'BLING_DOWN':
            case 'CONNECTION_LOSS':
                // Infrastructure issue. Pause and let the scheduler/health monitor resume later.
                this.stateMachine.transitionTo('PAUSED', { reason: category });
                break;

            case 'AI_FAILURE':
            case 'TIMEOUT':
            case 'UNKNOWN':
            default:
                // Mark as error. The RetryEngine might catch this before it hits the global handler,
                // but if it bubbles up here, we pause the specific job.
                this.stateMachine.transitionTo('ERROR', { reason: category });
                break;
        }
    }

    private categorizeError(error: any): ExceptionCategory {
        const msg = (error.message || '').toLowerCase();
        
        if (msg.includes('captcha')) return 'CAPTCHA';
        if (msg.includes('2fa') || msg.includes('two factor') || msg.includes('mfa')) return 'TWO_FACTOR_AUTH';
        if (msg.includes('wedrop') && (msg.includes('503') || msg.includes('down') || msg.includes('timeout'))) return 'WEDROP_DOWN';
        if (msg.includes('amazon') && (msg.includes('503') || msg.includes('down') || msg.includes('quota'))) return 'AMAZON_DOWN';
        if (msg.includes('bling') && (msg.includes('503') || msg.includes('down'))) return 'BLING_DOWN';
        if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('offline')) return 'CONNECTION_LOSS';
        if (msg.includes('ai') || msg.includes('gemini') || msg.includes('generation failed')) return 'AI_FAILURE';
        if (msg.includes('timeout')) return 'TIMEOUT';

        return 'UNKNOWN';
    }
}
