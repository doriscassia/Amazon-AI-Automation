import { IAIImageProvider, ImageGenerationContext, GeneratedImage } from '../types';

export class AIImageGenerator {
    constructor(private provider: IAIImageProvider) {}

    /**
     * Generates the MAIN image.
     * Strict adherence to physical traits, pure white background, professional studio lighting.
     */
    async generateMainImage(context: ImageGenerationContext): Promise<GeneratedImage> {
        const prompt = `Generate a highly realistic, professional studio photography shot of this product. 
        CRITICAL: The product must have exactly these characteristics: ${JSON.stringify(context.visualCharacteristics)}. 
        Do not change the color, shape, or add accessories. 
        The background must be pure white. The lighting must be bright and even.`;

        const url = await this.provider.generateImage(prompt, context.referenceImages[0]);

        return {
            url,
            type: 'MAIN',
            metadata: { promptUsed: prompt }
        };
    }
}
