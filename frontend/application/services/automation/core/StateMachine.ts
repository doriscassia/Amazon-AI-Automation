import { GlobalState, IEventDispatcher } from '../types';

export class StateMachine {
    private currentState: GlobalState = 'IDLE';

    constructor(private dispatcher: IEventDispatcher) {}

    transitionTo(newState: GlobalState, payload?: any): void {
        if (this.currentState === newState) return;

        const oldState = this.currentState;
        this.currentState = newState;

        this.dispatcher.dispatch({
            type: 'STATE_CHANGED',
            state: this.currentState,
            timestamp: new Date(),
            payload: { oldState, newState, ...payload }
        });
    }

    getCurrentState(): GlobalState {
        return this.currentState;
    }

    isPausedOrWaiting(): boolean {
        return ['PAUSED', 'WAITING_USER', 'ERROR'].includes(this.currentState);
    }
}
