import { IAIGeneratorProvider } from '../../../application/services/ai/types';

export class GeminiProviderProxy implements IAIGeneratorProvider {
    private baseUrl = 'http://localhost:3000/api/ai';

    async generateContent(systemInstruction: string, prompt: string, context: any): Promise<string> {
        const res = await fetch(`${this.baseUrl}/generate-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemInstruction, prompt, context })
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async generateStructuredContent<T>(systemInstruction: string, prompt: string, context: any, schemaName: string): Promise<T> {
        const res = await fetch(`${this.baseUrl}/generate-structured-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemInstruction, prompt, context, schemaName })
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result as T;
    }
}
