export interface DiagnosticResult {
    module: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    messages: string[];
    timestamp: Date;
}

export interface IDiagnosticTool {
    run(): Promise<DiagnosticResult>;
}
