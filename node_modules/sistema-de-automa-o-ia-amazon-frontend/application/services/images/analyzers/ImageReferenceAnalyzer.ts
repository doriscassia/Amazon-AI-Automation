import { IAIImageProvider, VisualCharacteristics } from '../types';

export class ImageReferenceAnalyzer {
    constructor(private provider: IAIImageProvider) {}

    /**
     * CRITICAL RULE: Wedrop images are ONLY references.
     * This analyzer extracts the exact physical traits (color, shape, material)
     * so the generator can recreate the EXACT same product in new contexts.
     */
    async extractCharacteristics(referenceImages: string[]): Promise<VisualCharacteristics> {
        if (!referenceImages || referenceImages.length === 0) {
            throw new Error("At least one reference image is required to maintain product fidelity.");
        }

        const prompt = "Analyze this reference image. Extract the exact colors, shape, materials, accessories, and key visual features. Do not invent details. The goal is strict fidelity to the physical product.";
        
        // Use the primary reference image for base extraction
        return await this.provider.analyzeReferenceImage(referenceImages[0], prompt);
    }
}
