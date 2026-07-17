export type Environment = 'development' | 'staging' | 'production';

export class EnvironmentManager {
    private env: Environment;
    private variables: Map<string, string>;

    constructor() {
        // In a real Node/React environment, this would read from process.env or import.meta.env
        this.env = (process?.env?.NODE_ENV as Environment) || 'development';
        this.variables = new Map<string, string>();
        
        this.loadDefaults();
    }

    private loadDefaults(): void {
        this.variables.set('API_TIMEOUT', '30000');
        this.variables.set('MAX_RETRIES', '3');
        
        if (this.env === 'production') {
            this.variables.set('LOG_LEVEL', 'ERROR');
        } else if (this.env === 'staging') {
            this.variables.set('LOG_LEVEL', 'WARN');
        } else {
            this.variables.set('LOG_LEVEL', 'DEBUG');
        }
    }

    getEnvironment(): Environment {
        return this.env;
    }

    isProduction(): boolean {
        return this.env === 'production';
    }

    isDevelopment(): boolean {
        return this.env === 'development';
    }

    get(key: string, defaultValue: string = ''): string {
        return this.variables.get(key) || process?.env?.[key] || defaultValue;
    }

    set(key: string, value: string): void {
        this.variables.set(key, value);
    }
}
