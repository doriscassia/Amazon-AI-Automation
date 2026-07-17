import { EnvironmentManager } from './EnvironmentManager';
import { FeatureFlags } from './FeatureFlags';

export class GlobalConfig {
    private static instance: GlobalConfig;
    
    public readonly env: EnvironmentManager;
    public readonly features: FeatureFlags;

    private constructor() {
        this.env = new EnvironmentManager();
        this.features = new FeatureFlags();
    }

    public static getInstance(): GlobalConfig {
        if (!GlobalConfig.instance) {
            GlobalConfig.instance = new GlobalConfig();
        }
        return GlobalConfig.instance;
    }

    public getSupabaseConfig() {
        return {
            url: this.env.get('SUPABASE_URL', 'https://placeholder.supabase.co'),
            key: this.env.get('SUPABASE_ANON_KEY', 'placeholder-key')
        };
    }

    public getGeminiConfig() {
        return {
            apiKey: this.env.get('GEMINI_API_KEY', 'placeholder-key'),
            modelText: 'gemini-2.5-flash',
            modelImage: 'imagen-4.0-generate-001'
        };
    }
}
