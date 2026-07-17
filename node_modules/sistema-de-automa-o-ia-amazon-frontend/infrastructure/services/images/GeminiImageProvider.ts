import { GoogleGenAI, Type, Modality } from '@google/genai';
import { IAIImageProvider, VisualCharacteristics } from '../../../application/services/images/types';

// ============================================================================
// INTERNAL IMAGE AI INFRASTRUCTURE COMPONENTS
// ============================================================================

class ImageAILogger {
    static info(msg: string) {
        console.log(`[Gemini Image AI][INFO] ${msg}`);
    }
    static error(msg: string, err: any) {
        console.error(`[Gemini Image AI][ERROR] ${msg}`, err);
    }
    static warn(msg: string) {
        console.warn(`[Gemini Image AI][WARN] ${msg}`);
    }
}

class ImageAIRateLimiter {
    private lastCall = 0;
    private readonly minDelayMs = 2000; // Prevent hitting quota limits for image models

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
                if (attempt === maxRetries) {
                    ImageAILogger.error(`Operation failed permanently after ${maxRetries} attempts.`, error);
                    throw error;
                }

                const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
                const isTimeout = error.message?.includes('timeout');
                const isUnavailable = error.status === 503 || error.message?.includes('503');

                if (!isRateLimit && !isTimeout && !isUnavailable) {
                    ImageAILogger.error(`Non-retriable error encountered.`, error);
                    throw error;
                }

                const delay = 3000 * Math.pow(2, attempt - 1);
                ImageAILogger.warn(`Transient error detected. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, delay));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }
}

// ============================================================================
// MAIN PROVIDER IMPLEMENTATION
// ============================================================================

export class GeminiImageProvider implements IAIImageProvider {
    private ai: GoogleGenAI;
    private rateLimiter: ImageAIRateLimiter;

    constructor() {
        // The API key MUST be obtained exclusively from process.env.API_KEY
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
        this.rateLimiter = new ImageAIRateLimiter();
        ImageAILogger.info("GeminiImageProvider initialized successfully.");
    }

    /**
     * Helper to fetch an image from a URL or Data URL and convert it to Base64
     * required by the Gemini API inlineData format.
     */
    private async fetchBase64(url: string): Promise<{ mimeType: string, data: string }> {
        if (url.startsWith('data:')) {
            const [prefix, base64] = url.split(',');
            const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
            return { mimeType, data: base64 };
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${url}`);
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const [prefix, base64] = dataUrl.split(',');
                const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
                resolve({ mimeType, data: base64 });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async analyzeReferenceImage(imageUrl: string, prompt: string): Promise<VisualCharacteristics> {
        ImageAILogger.info(`Analyzing reference image...`);
        await this.rateLimiter.wait();

        const { mimeType, data } = await this.fetchBase64(imageUrl);

        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType, data } },
                        { text: prompt }
                    ]
                },
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
                    temperature: 0.2 // Low temperature for factual extraction
                }
            });

            if (!response.text) throw new Error("Empty response from Gemini API during image analysis.");
            
            const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned) as VisualCharacteristics;
        });
    }

    async generateImage(prompt: string, referenceImage?: string): Promise<string> {
        ImageAILogger.info(`Generating new image...`);
        await this.rateLimiter.wait();

        // Note: imagen-4.0-generate-001 generates images from text prompts.
        // The reference image characteristics are already embedded in the text prompt by the ImageIntelligenceEngine.
        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1'
                }
            });

            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error("No image generated by Imagen API.");
            }

            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        });
    }

    async editImage(imageUrl: string, prompt: string): Promise<string> {
        ImageAILogger.info(`Editing image...`);
        await this.rateLimiter.wait();

        const { mimeType, data } = await this.fetchBase64(imageUrl);

        return await ImageAIRetry.execute(async () => {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data, mimeType } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT]
                }
            });

            if (!response.candidates || response.candidates.length === 0) {
                throw new Error("No candidates returned from image edit operation.");
            }

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }

            throw new Error("No image data found in the edit response.");
        });
    }
}
