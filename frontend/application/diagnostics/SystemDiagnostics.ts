import { ArchitectureValidator } from './ArchitectureValidator';
import { DependencyValidator } from './DependencyValidator';
import { ProjectHealthChecker } from './ProjectHealthChecker';
import { BuildValidator } from './BuildValidator';
import { StartupValidator } from './StartupValidator';
import { DiagnosticResult } from './types';

export class SystemDiagnostics {
    private tools = [
        new StartupValidator(),
        new BuildValidator(),
        new ArchitectureValidator(),
        new DependencyValidator(),
        new ProjectHealthChecker()
    ];

    async runAllDiagnostics(): Promise<DiagnosticResult[]> {
        console.log("=========================================");
        console.log("STARTING SYSTEM DIAGNOSTICS & VALIDATION");
        console.log("=========================================");

        const results: DiagnosticResult[] = [];

        for (const tool of this.tools) {
            const result = await tool.run();
            results.push(result);
            
            console.log(`\n[${result.module}] - Status: ${result.status}`);
            result.messages.forEach(msg => console.log(`  -> ${msg}`));
        }

        const hasFailures = results.some(r => r.status === 'FAIL');
        
        console.log("\n=========================================");
        if (hasFailures) {
            console.error("DIAGNOSTICS FAILED. Check logs above.");
        } else {
            console.log("ALL DIAGNOSTICS PASSED. SYSTEM READY.");
        }
        console.log("=========================================\n");

        return results;
    }
}
