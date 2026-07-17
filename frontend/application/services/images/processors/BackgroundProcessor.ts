import { IAIImageProvider } from '../types';

export class BackgroundProcessor {
    constructor(private provider: IAIImageProvider) {}

    /**
     * Amazon Mandatory Rule: Main images MUST have a pure white background (RGB 255,255,255).
     */
    async applyPureWhiteBackground(imageUrl: string): Promise<string> {
        const prompt = "Remove the background completely and replace it with pure white (RGB 255, 255, 255). Do not alter the product itself. Ensure clean edges.";
        return await this.provider.editImage(imageUrl, prompt);
    }
}
