import { IAIImageProvider } from '../types';

export class ResolutionEnhancer {
    constructor(private provider: IAIImageProvider) {}

    /**
     * Amazon Recommendation: Images should be at least 1000x1000 pixels (ideally 2000x2000) to enable zoom.
     */
    async enhance(imageUrl: string): Promise<string> {
        const prompt = "Upscale and enhance this image to 2000x2000 pixels. Improve sharpness and clarity without introducing artifacts.";
        return await this.provider.editImage(imageUrl, prompt);
    }
}
