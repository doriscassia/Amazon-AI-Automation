import { IAIGeneratorProvider, IAIModule, OptimizedListing } from '../types';
import { WedropProduct } from '../../../../infrastructure/services/wedrop/types';
import { SEOData } from './SEOModule';

export interface CopywritingData {
    title: string;
    bulletPoints: string[];
    description: string;
}

export class CopywritingModule implements IAIModule {
    private provider!: IAIGeneratorProvider;

    setProvider(provider: IAIGeneratorProvider): void {
        this.provider = provider;
    }

    async generate(product: WedropProduct, seoData: SEOData): Promise<CopywritingData> {
        const instruction = "You are a world-class Amazon Copywriter. Your goal is to maximize conversion rates. Write a highly optimized title (max 200 chars), 5 persuasive bullet points focusing on benefits, and a professional HTML-formatted description. Integrate the provided SEO keywords naturally.";
        const prompt = `Product: ${product.title}. Category: ${product.category}. Description: ${product.description}. Keywords to include: ${seoData.searchTerms.join(', ')}`;
        
        return this.provider.generateStructuredContent<CopywritingData>(
            instruction, 
            prompt, 
            { product, seoData }, 
            'CopywritingDataSchema'
        );
    }

    async improve(currentData: CopywritingData, feedback: string[], product: WedropProduct): Promise<CopywritingData> {
        const instruction = "You are a world-class Amazon Copywriter. Improve the existing copy based on the provided feedback to increase readability and conversion.";
        const prompt = `Current Copy: ${JSON.stringify(currentData)}. Feedback: ${feedback.join(', ')}. Product: ${product.title}`;
        
        return this.provider.generateStructuredContent<CopywritingData>(
            instruction, 
            prompt, 
            product, 
            'CopywritingDataSchema'
        );
    }
}
