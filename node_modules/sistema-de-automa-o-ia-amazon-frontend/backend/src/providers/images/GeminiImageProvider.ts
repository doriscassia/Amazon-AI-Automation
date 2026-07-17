import { GoogleGenAI, Type, Modality } from '@google/genai';

class ImageAIRateLimiter {
    private lastCall = 0;
    private readonly minDelayMs = 2000;
    async wait(): Promise<void> {
        const now = Date.now();
        const timeSinceLast = now - this.lastCall;
        if (timeSinceLast < this.minDelayMs) {
            await new Promise(res => setTimeout(res, this.minDelayMs - timeSinceLast));
        }
        this.lastCall = Date.now();
    }
}

class ImageAIRetry {
    static async execute<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 1;
        while (attempt <= maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                if (attempt === maxRetries) throw error;
                const delay = 3000 * Math.pow(2, attempt - 1);
                await new Promise(res => setTimeout(res, delay));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }
}

export class GeminiImageProvider {
    private ai: GoogleGenAI;
    private rateLimiter: ImageAIRateLimiter;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
        this.rateLimiter = new ImageAIRateLimiter();
    }

    private async fetchBase64(url: string): Promise<{ mimeType: string, data: string }> {
        if (url.startsWith('data:')) {
            const [prefix, base64] = url.split(',');
            const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
            return { mimeType, data: base64 };
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return { mimeType, data: buffer.toString('base64') };
    }

    async analyzeReferenceImage(imageUrl: string, prompt: string): Promise<any> {
        await this.rateLimiter.wait();
        const { mimeType, data } = await this.fetchBase64(imageUrl);

        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { role: 'user', parts: [{ inlineData: { mimeType, data } }, { text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            shape: { type: Type.STRING },
                            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keyVisualFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                            accessories: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    },
                    temperature: 0.2
                }
            });
            if (!response.text) throw new Error("Empty response from Gemini API.");
            const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        });
    }

    async generateImage(prompt: string, referenceImage?: string): Promise<string> {
        await this.rateLimiter.wait();
        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
            });
            if (!response.generatedImages || response.generatedImages.length === 0) throw new Error("No image generated.");
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        });
    }

    async editImage(imageUrl: string, prompt: string): Promise<string> {
        await this.rateLimiter.wait();
        const { mimeType, data } = await this.fetchBase64(imageUrl);

        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { role: 'user', parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
            });
            if (!response.candidates || response.candidates.length === 0) throw new Error("No candidates returned.");
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            throw new Error("No image data found in the edit response.");
        });
    }
}
