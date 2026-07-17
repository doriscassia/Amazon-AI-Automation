export class FeatureFlags {
    private flags: Map<string, boolean>;

    constructor() {
        this.flags = new Map<string, boolean>();
        this.initializeDefaults();
    }

    private initializeDefaults(): void {
        // Core features
        this.flags.set('ENABLE_WEDROP_SYNC', true);
        this.flags.set('ENABLE_AI_LISTING', true);
        this.flags.set('ENABLE_PRICING_ENGINE', true);
        this.flags.set('ENABLE_IMAGE_INTELLIGENCE', true);
        this.flags.set('ENABLE_AMAZON_PUBLISHER', true);
        this.flags.set('ENABLE_BLING_INTEGRATION', true);
        
        // Experimental features (disabled by default)
        this.flags.set('ENABLE_ADVANCED_SCRAPING', false);
        this.flags.set('ENABLE_AUTO_REPRICING', false);
    }

    isEnabled(featureName: string): boolean {
        return this.flags.get(featureName) ?? false;
    }

    enable(featureName: string): void {
        this.flags.set(featureName, true);
    }

    disable(featureName: string): void {
        this.flags.set(featureName, false);
    }
}
