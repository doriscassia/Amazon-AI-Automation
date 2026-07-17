import { IAIImageProvider, ImageGenerationContext, GeneratedImage } from '../types';

export class DimensionImageGenerator {
    constructor(private provider: IAIImageProvider) {}

    async generate(context: ImageGenerationContext): Promise<GeneratedImage> {
        const dims = context.product.dimensions;
        const prompt = `Generate a technical e-commerce image showing the product dimensions.
        Product characteristics: ${JSON.stringify(context.visualCharacteristics)}.
        Add clean, professional dimension lines and text indicating: Length ${dims.length}cm, Width ${dims.width}cm, Height ${dims.height}cm.
        Use a clean, neutral background.`;

        const url = await this.provider.generateImage(prompt, context.referenceImages[0]);

        return {
            url,
            type: 'DIMENSIONS',
            metadata: { promptUsed: prompt, dimensions: dims }
        };
    }
}
