import { IAIGeneratorProvider, IAIModule } from '../types';
import { WedropProduct } from '../../../../infrastructure/services/wedrop/types';

export interface StructureData {
    technicalSpecs: Record<string, string>;
    mandatoryAttributes: Record<string, string>;
}

export class AmazonStructureModule implements IAIModule {
    private provider!: IAIGeneratorProvider;

    setProvider(provider: IAIGeneratorProvider): void {
        this.provider = provider;
    }

    async extract(product: WedropProduct): Promise<StructureData> {
        const instruction = "You are an Amazon Catalog Specialist. Extract and format technical specifications and identify mandatory Amazon attributes (like Brand, Color, Size, Material, etc.) from the raw product data.";
        const prompt = `Extract structured attributes from: ${product.title}. Raw attributes: ${JSON.stringify(product.attributes)}. Dimensions: ${JSON.stringify(product.dimensions)}. Weight: ${product.weight}`;
        
        return this.provider.generateStructuredContent<StructureData>(
            instruction, 
            prompt, 
            product, 
            'StructureDataSchema'
        );
    }
}
