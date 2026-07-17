import { IAIGeneratorProvider, IAIModule } from '../types';
import { WedropProduct } from '../../../../infrastructure/services/wedrop/types';

export interface SEOData {
    backendKeywords: string[];
    searchTerms: string[];
    secondaryKeywords: string[];
}

export class SEOModule implements IAIModule {
    private provider!: IAIGeneratorProvider;

    setProvider(provider: IAIGeneratorProvider): void {
        this.provider = provider;
    }

    async analyze(product: WedropProduct): Promise<SEOData> {
        const instruction = "You are an elite Amazon SEO expert. Your goal is to maximize organic discoverability. Extract and generate highly relevant backend keywords, search terms, and secondary keywords based on the product data. Do not use generic terms.";
        const prompt = `Analyze the following product and generate SEO data: ${product.title} - ${product.category}`;
        
        return this.provider.generateStructuredContent<SEOData>(
            instruction, 
            prompt, 
            product, 
            'SEODataSchema'
        );
    }

    async improve(currentData: SEOData, feedback: string[], product: WedropProduct): Promise<SEOData> {
        const instruction = "You are an elite Amazon SEO expert. Improve the existing SEO data based on the provided feedback to increase the conversion score.";
        const prompt = `Current Data: ${JSON.stringify(currentData)}. Feedback: ${feedback.join(', ')}. Product: ${product.title}`;
        
        return this.provider.generateStructuredContent<SEOData>(
            instruction, 
            prompt, 
            product, 
            'SEODataSchema'
        );
    }
}
