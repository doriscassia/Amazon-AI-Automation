import { IAIImageProvider, ImageGenerationContext, GeneratedImage } from '../types';

export class LifestyleImageGenerator {
    constructor(private provider: IAIImageProvider) {}

    async generate(context: ImageGenerationContext, environment: string): Promise<GeneratedImage> {
        const prompt = `Generate a highly realistic lifestyle image of this product being used in a ${environment} setting.
        CRITICAL: The product itself must remain exactly as described: ${JSON.stringify(context.visualCharacteristics)}.
        The lighting should match the environment naturally. Focus on emotional connection and practical use.`;

        const url = await this.provider.generateImage(prompt, context.referenceImages[0]);

        return {
            url,
            type: 'LIFESTYLE',
            metadata: { promptUsed: prompt, environment }
        };
    }
}
