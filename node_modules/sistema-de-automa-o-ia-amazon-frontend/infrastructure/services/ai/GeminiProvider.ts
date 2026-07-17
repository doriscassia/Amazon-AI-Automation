import { GoogleGenAI, Type, Schema } from '@google/genai';
import { IAIGeneratorProvider } from '../../../application/services/ai/types';

// ============================================================================
// INTERNAL AI INFRASTRUCTURE COMPONENTS
// ============================================================================

class AILogger {
    static info(msg: string) {
        console.log(`[Gemini AI][INFO] ${msg}`);
    }
    static error(msg: string, err: any) {
        console.error(`[Gemini AI][ERROR] ${msg}`, err);
    }
    static warn(msg: string) {
        console.warn(`[Gemini AI][WARN] ${msg}`);
    }
}

class AICache {
    private cache = new Map<string, any>();
    
    get(key: string) {
        return this.cache.get(key);
    }
    
    set(key: string, value: any) {
        this.cache.set(key, value);
    }
}

class AIRateLimiter {
    private lastCall = 0;
    private readonly minDelayMs = 1500; // Prevent hitting quota limits (e.g., 15 RPM)

    async wait(): Promise<void> {
        const now = Date.now();
        const timeSinceLast = now - this.lastCall;
        if (timeSinceLast < this.minDelayMs) {
            await new Promise(res => setTimeout(res, this.minDelayMs - timeSinceLast));
        }
        this.lastCall = Date.now();
    }
}

class AIRetry {
    static async execute<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 1;
        while (attempt <= maxRetries) {
            try {
                return await operation();
            } catch (error: any) {
                if (attempt === maxRetries) {
                    AILogger.error(`Operation failed permanently after ${maxRetries} attempts.`, error);
                    throw error;
                }

                const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
                const isTimeout = error.message?.includes('timeout');
                const isUnavailable = error.status === 503 || error.message?.includes('503');
                const isInvalidResponse = error.message?.includes('Invalid JSON');

                if (!isRateLimit && !isTimeout && !isUnavailable && !isInvalidResponse) {
                    AILogger.error(`Non-retriable error encountered.`, error);
                    throw error; // Don't retry on bad requests (400) or auth errors (401/403)
                }

                const delay = 2000 * Math.pow(2, attempt - 1);
                AILogger.warn(`Transient error detected. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, delay));
                attempt++;
            }
        }
        throw new Error("Unreachable");
    }
}

class AIResponseParser {
    static parseJSON(text: string): any {
        try {
            // Clean up markdown code blocks if the model wraps the JSON
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            throw new Error("Invalid JSON response from AI");
        }
    }
}

class AIValidation {
    static validateSchema(data: any, schemaName: string): boolean {
        if (!data) return false;
        
        // Basic structural validation to ensure the model didn't hallucinate a completely different structure
        if (schemaName === 'QualityScoreSchema' && typeof data.overall !== 'number') return false;
        if (schemaName === 'CopywritingDataSchema' && !data.title) return false;
        
        return true;
    }
}

class PromptManager {
    private static readonly VERSION = "v1.0.0";

    static format(systemInstruction: string, prompt: string, context: any): string {
        // Applies templates and versioning to ensure consistent prompt structures
        return `[Prompt Version: ${this.VERSION}]\n\nContext Data:\n${JSON.stringify(context, null, 2)}\n\nTask:\n${prompt}`;
    }
}

// ============================================================================
// SCHEMAS DEFINITION
// ============================================================================

const schemas: Record<string, Schema> = {
    SEODataSchema: {
        type: Type.OBJECT,
        properties: {
            backendKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    },
    CopywritingDataSchema: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
        }
    },
    ConversionDataSchema: {
        type: Type.OBJECT,
        properties: {
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitiveAdvantages: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    },
    StructureDataSchema: {
        type: Type.OBJECT,
        properties: {
            technicalSpecs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, value: { type: Type.STRING } }
                }
            },
            mandatoryAttributes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, value: { type: Type.STRING } }
                }
            }
        }
    },
    QualityScoreSchema: {
        type: Type.OBJECT,
        properties: {
            seo: { type: Type.NUMBER },
            conversion: { type: Type.NUMBER },
            readability: { type: Type.NUMBER },
            completeness: { type: Type.NUMBER },
            overall: { type: Type.NUMBER },
            feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    }
};

// ============================================================================
// MAIN PROVIDER IMPLEMENTATION
// ============================================================================

export class GeminiProvider implements IAIGeneratorProvider {
    private ai: GoogleGenAI;
    private cache: AICache;
    private rateLimiter: AIRateLimiter;

    constructor() {
        // The API key MUST be obtained exclusively from process.env.API_KEY
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
        this.cache = new AICache();
        this.rateLimiter = new AIRateLimiter();
        AILogger.info("GeminiProvider initialized successfully.");
    }

    async generateContent(systemInstruction: string, prompt: string, context: any): Promise<string> {
        const fullPrompt = PromptManager.format(systemInstruction, prompt, context);
        
        // Simple hash for cache key
        const cacheKey = `text:${Buffer?.from ? Buffer.from(fullPrompt).toString('base64') : btoa(fullPrompt)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            AILogger.info("Cache hit for text generation.");
            return cached;
        }

        await this.rateLimiter.wait();

        const result = await AIRetry.execute(async () => {
            AILogger.info("Calling Gemini API for text generation...");
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    role: 'user',
                    parts: [{ text: fullPrompt }]
                },
                config: {
                    systemInstruction,
                    temperature: 0.7
                }
            });
            
            if (!response.text) throw new Error("Empty response from Gemini API.");
            return response.text;
        });

        this.cache.set(cacheKey, result);
        return result;
    }

    async generateStructuredContent<T>(systemInstruction: string, prompt: string, context: any, schemaName: string): Promise<T> {
        const schema = schemas[schemaName];
        if (!schema) throw new Error(`Schema ${schemaName} is not defined in the provider.`);

        const fullPrompt = PromptManager.format(systemInstruction, prompt, context);
        
        const cacheKey = `struct:${schemaName}:${Buffer?.from ? Buffer.from(fullPrompt).toString('base64') : btoa(fullPrompt)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            AILogger.info(`Cache hit for structured generation [${schemaName}].`);
            return cached;
        }

        await this.rateLimiter.wait();

        const result = await AIRetry.execute(async () => {
            AILogger.info(`Calling Gemini API for structured generation [${schemaName}]...`);
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    role: 'user',
                    parts: [{ text: fullPrompt }]
                },
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                    temperature: 0.4 // Lower temperature for more deterministic structured output
                }
            });
            
            if (!response.text) throw new Error("Empty response from Gemini API.");
            
            const parsedData = AIResponseParser.parseJSON(response.text);
            
            if (!AIValidation.validateSchema(parsedData, schemaName)) {
                throw new Error(`Invalid JSON structure returned for schema ${schemaName}`);
            }

            return parsedData;
        });

        // Post-processing: Map array of KV pairs back to Record<string, string> for StructureDataSchema
        let finalResult = result;
        if (schemaName === 'StructureDataSchema') {
            const techSpecs: Record<string, string> = {};
            const mandAttrs: Record<string, string> = {};
            
            if (result.technicalSpecs) {
                result.technicalSpecs.forEach((item: any) => { if (item.key) techSpecs[item.key] = item.value || ''; });
            }
            if (result.mandatoryAttributes) {
                result.mandatoryAttributes.forEach((item: any) => { if (item.key) mandAttrs[item.key] = item.value || ''; });
            }
            
            finalResult = {
                technicalSpecs: techSpecs,
                mandatoryAttributes: mandAttrs
            };
        }

        this.cache.set(cacheKey, finalResult);
        return finalResult as T;
    }
}
