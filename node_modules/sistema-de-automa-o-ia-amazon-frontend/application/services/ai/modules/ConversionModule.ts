import { IAIGeneratorProvider, IAIModule } from '../types';
import { WedropProduct } from '../../../../infrastructure/services/wedrop/types';

export interface ConversionData {
    benefits: string[];
    competitiveAdvantages: string[];
}

export class ConversionModule implements IAIModule {
    private provider!: IAIGeneratorProvider;

    setProvider(provider: IAIGeneratorProvider): void {
        this.provider = provider;
    }

    async analyze(product: WedropProduct): Promise<ConversionData> {
        const instruction = "You are an Amazon Conversion Rate Optimization (CRO) specialist. Identify the core emotional and practical benefits of this product, and extract its main competitive advantages compared to generic alternatives.";
        const prompt = `Analyze this product and extract benefits and competitive advantages: ${product.title} - ${product.description}`;
        
        return this.provider.generateStructuredContent<ConversionData>(
            instruction, 
            prompt, 
            product, 
            'ConversionDataSchema'
        );
    }
}
