import { AutomationEvent, IEventDispatcher } from '../types';

export class EventDispatcher implements IEventDispatcher {
    private listeners: Map<string, Array<(event: AutomationEvent) => void>> = new Map();

    dispatch(event: AutomationEvent): void {
        const callbacks = this.listeners.get(event.type) || [];
        callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error(`[EventDispatcher] Error in listener for event ${event.type}:`, error);
            }
        });
        
        // Also dispatch to a catch-all '*' listener if needed for global logging
        const globalCallbacks = this.listeners.get('*') || [];
        globalCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error(`[EventDispatcher] Error in global listener:`, error);
            }
        });
    }

    subscribe(eventType: string, callback: (event: AutomationEvent) => void): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push(callback);
    }
}
