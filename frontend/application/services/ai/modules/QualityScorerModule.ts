import { IAIGeneratorProvider, IAIModule, OptimizedListing, QualityScore } from '../types';

export class QualityScorerModule implements IAIModule {
    private provider!: IAIGeneratorProvider;

    setProvider(provider: IAIGeneratorProvider): void {
        this.provider = provider;
    }

    async evaluate(listing: Omit<OptimizedListing, 'score'>): Promise<QualityScore> {
        const instruction = "You are an Amazon Listing Quality Auditor. Evaluate the provided listing data on a scale of 0 to 100 for SEO, Conversion, Readability, and Completeness. Calculate the overall average. Provide specific feedback for any score below 85.";
        const prompt = `Evaluate this listing: Title: ${listing.title}. Bullets: ${listing.bulletPoints.join(' | ')}. Keywords: ${listing.searchTerms.join(', ')}`;
        
        return this.provider.generateStructuredContent<QualityScore>(
            instruction, 
            prompt, 
            listing, 
            'QualityScoreSchema'
        );
    }
}
