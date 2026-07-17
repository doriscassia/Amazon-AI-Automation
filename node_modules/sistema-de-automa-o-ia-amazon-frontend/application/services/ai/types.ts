import { WedropProduct } from '../../../infrastructure/services/wedrop/types';

export interface QualityScore {
    seo: number;
    conversion: number;
    readability: number;
    completeness: number;
    overall: number;
    feedback: string[];
}

export interface OptimizedListing {
    title: string;
    bulletPoints: string[];
    description: string;
    technicalSpecs: Record<string, string>;
    mandatoryAttributes: Record<string, string>;
    backendKeywords: string[];
    searchTerms: string[];
    secondaryKeywords: string[];
    benefits: string[];
    competitiveAdvantages: string[];
    score?: QualityScore;
}

export interface IAIGeneratorProvider {
    generateContent(systemInstruction: string, prompt: string, context: any): Promise<string>;
    generateStructuredContent<T>(systemInstruction: string, prompt: string, context: any, schemaName: string): Promise<T>;
}

export interface IAIModule {
    setProvider(provider: IAIGeneratorProvider): void;
}
