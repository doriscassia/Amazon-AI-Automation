import { IAIImageProvider, ImageGenerationContext, GeneratedImage, AmazonImageType } from '../types';

export class InfographicGenerator {
    constructor(private provider: IAIImageProvider) {}

    async generate(context: ImageGenerationContext, type: AmazonImageType, textContent: string[]): Promise<GeneratedImage> {
        const prompt = `Generate a high-converting e-commerce infographic of type ${type}. 
        Product characteristics: ${JSON.stringify(context.visualCharacteristics)}.
        Include modern, clean typography highlighting these points: ${textContent.join(', ')}.
        Use a lifestyle or gradient background that contrasts well with the text.`;

        const url = await this.provider.generateImage(prompt, context.referenceImages[0]);

        return {
            url,
            type,
            metadata: { promptUsed: prompt, textContent }
        };
    }
}
