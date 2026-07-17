import { IAIImageProvider, VisualCharacteristics } from '../../../application/services/images/types';

export class GeminiImageProviderProxy implements IAIImageProvider {
    private baseUrl = 'http://localhost:3000/api/images';

    async analyzeReferenceImage(imageUrl: string, prompt: string): Promise<VisualCharacteristics> {
        const res = await fetch(`${this.baseUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, prompt })
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async generateImage(prompt: string, referenceImage?: string): Promise<string> {
        const res = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, referenceImage })
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }

    async editImage(imageUrl: string, prompt: string): Promise<string> {
        const res = await fetch(`${this.baseUrl}/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, prompt })
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.result;
    }
}
