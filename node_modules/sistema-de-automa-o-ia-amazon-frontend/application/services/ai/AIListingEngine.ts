import { IAIGeneratorProvider, OptimizedListing, QualityScore } from './types';
import { WedropProduct } from '../../../infrastructure/services/wedrop/types';
import { SEOModule } from './modules/SEOModule';
import { CopywritingModule } from './modules/CopywritingModule';
import { ConversionModule } from './modules/ConversionModule';
import { AmazonStructureModule } from './modules/AmazonStructureModule';
import { QualityScorerModule } from './modules/QualityScorerModule';

export class AIListingEngine {
    private readonly MIN_ACCEPTABLE_SCORE = 85;
    private readonly MAX_IMPROVEMENT_ATTEMPTS = 3;

    constructor(
        private provider: IAIGeneratorProvider,
        private seoModule: SEOModule,
        private copyModule: CopywritingModule,
        private conversionModule: ConversionModule,
        private structureModule: AmazonStructureModule,
        private scorerModule: QualityScorerModule
    ) {
        // Inject provider into all modules
        this.seoModule.setProvider(this.provider);
        this.copyModule.setProvider(this.provider);
        this.conversionModule.setProvider(this.provider);
        this.structureModule.setProvider(this.provider);
        this.scorerModule.setProvider(this.provider);
    }

    async processProduct(product: WedropProduct): Promise<OptimizedListing> {
        // Step 1: Initial Draft Generation
        let listing = await this.generateDraft(product);

        // Step 2: Quality Evaluation
        let score = await this.scorerModule.evaluate(listing);
        listing.score = score;

        // Step 3: Auto-Improvement Loop
        let attempts = 0;
        while (score.overall < this.MIN_ACCEPTABLE_SCORE && attempts < this.MAX_IMPROVEMENT_ATTEMPTS) {
            listing = await this.improveListing(listing, score, product);
            score = await this.scorerModule.evaluate(listing);
            listing.score = score;
            attempts++;
        }

        return listing;
    }

    private async generateDraft(product: WedropProduct): Promise<OptimizedListing> {
        // Parallel execution for independent analysis modules
        const [seoData, conversionData, structureData] = await Promise.all([
            this.seoModule.analyze(product),
            this.conversionModule.analyze(product),
            this.structureModule.extract(product)
        ]);

        // Copywriting depends on SEO data
        const copyData = await this.copyModule.generate(product, seoData);

        return {
            title: copyData.title,
            bulletPoints: copyData.bulletPoints,
            description: copyData.description,
            technicalSpecs: structureData.technicalSpecs,
            mandatoryAttributes: structureData.mandatoryAttributes,
            backendKeywords: seoData.backendKeywords,
            searchTerms: seoData.searchTerms,
            secondaryKeywords: seoData.secondaryKeywords,
            benefits: conversionData.benefits,
            competitiveAdvantages: conversionData.competitiveAdvantages
        };
    }

    private async improveListing(currentListing: OptimizedListing, score: QualityScore, product: WedropProduct): Promise<OptimizedListing> {
        let updatedListing = { ...currentListing };

        // Improve specific areas based on score feedback
        if (score.seo < this.MIN_ACCEPTABLE_SCORE) {
            const improvedSeo = await this.seoModule.improve({
                backendKeywords: currentListing.backendKeywords,
                searchTerms: currentListing.searchTerms,
                secondaryKeywords: currentListing.secondaryKeywords
            }, score.feedback, product);
            
            updatedListing.backendKeywords = improvedSeo.backendKeywords;
            updatedListing.searchTerms = improvedSeo.searchTerms;
            updatedListing.secondaryKeywords = improvedSeo.secondaryKeywords;
        }

        if (score.conversion < this.MIN_ACCEPTABLE_SCORE || score.readability < this.MIN_ACCEPTABLE_SCORE) {
            const improvedCopy = await this.copyModule.improve({
                title: currentListing.title,
                bulletPoints: currentListing.bulletPoints,
                description: currentListing.description
            }, score.feedback, product);

            updatedListing.title = improvedCopy.title;
            updatedListing.bulletPoints = improvedCopy.bulletPoints;
            updatedListing.description = improvedCopy.description;
        }

        return updatedListing;
    }
}
