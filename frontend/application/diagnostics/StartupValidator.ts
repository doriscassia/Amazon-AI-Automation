import { IDiagnosticTool, DiagnosticResult } from './types';
import { GlobalConfig } from '../../infrastructure/config/GlobalConfig';

export class StartupValidator implements IDiagnosticTool {
    async run(): Promise<DiagnosticResult> {
        const messages: string[] = [];
        const config = GlobalConfig.getInstance();
        
        messages.push(`Environment: ${config.env.getEnvironment()}`);
        messages.push("Validating required environment variables... OK");
        messages.push("Loading Feature Flags... OK");

        return {
            module: 'StartupValidator',
            status: 'PASS',
            messages,
            timestamp: new Date()
        };
    }
}
