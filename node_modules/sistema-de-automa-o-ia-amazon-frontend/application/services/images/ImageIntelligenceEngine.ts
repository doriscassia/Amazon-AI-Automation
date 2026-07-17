import { IAIImageProvider, GeneratedImage, ImageGenerationContext } from './types';
import { WedropProduct } from '../../../infrastructure/services/wedrop/types';
import { ProductVisionAnalyzer } from './analyzers/ProductVisionAnalyzer';
import { ImageReferenceAnalyzer } from './analyzers/ImageReferenceAnalyzer';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer';
import { BackgroundProcessor } from './processors/BackgroundProcessor';
import { ResolutionEnhancer } from './processors/ResolutionEnhancer';
import { AmazonImageValidator } from './validators/AmazonImageValidator';
import { AIImageGenerator } from './generators/AIImageGenerator';
import { InfographicGenerator } from './generators/InfographicGenerator';
import { LifestyleImageGenerator } from './generators/LifestyleImageGenerator';
import { DimensionImageGenerator } from './generators/DimensionImageGenerator';

export class ImageIntelligenceEngine {
    private visionAnalyzer: ProductVisionAnalyzer;
    private referenceAnalyzer: ImageReferenceAnalyzer;
    private qualityAnalyzer: QualityAnalyzer;
    private backgroundProcessor: BackgroundProcessor;
    private resolutionEnhancer: ResolutionEnhancer;
    private validator: AmazonImageValidator;
    
    private baseGenerator: AIImageGenerator;
    private infographicGenerator: InfographicGenerator;
    private lifestyleGenerator: LifestyleImageGenerator;
    private dimensionGenerator: DimensionImageGenerator;

    constructor(private provider: IAIImageProvider) {
        this.visionAnalyzer = new ProductVisionAnalyzer();
        this.referenceAnalyzer = new ImageReferenceAnalyzer(this.provider);
        this.qualityAnalyzer = new QualityAnalyzer();
        this.backgroundProcessor = new BackgroundProcessor(this.provider);
        this.resolutionEnhancer = new ResolutionEnhancer(this.provider);
        this.validator = new AmazonImageValidator();

        this.baseGenerator = new AIImageGenerator(this.provider);
        this.infographicGenerator = new InfographicGenerator(this.provider);
        this.lifestyleGenerator = new LifestyleImageGenerator(this.provider);
        this.dimensionGenerator = new DimensionImageGenerator(this.provider);
    }

    /**
     * Orchestrates the creation of a complete, high-converting Amazon image set.
     * Wedrop images are strictly used as references.
     */
    async generateImageSet(product: WedropProduct): Promise<GeneratedImage[]> {
        if (!product.images || product.images.length === 0) {
            throw new Error("Cannot generate images without Wedrop reference images.");
        }

        // 1. Analyze References (Extract exact physical traits)
        const visualCharacteristics = await this.referenceAnalyzer.extractCharacteristics(product.images);
        
        // 2. Analyze Vision (Extract marketing context)
        const visionReqs = this.visionAnalyzer.analyze(product);

        const context: ImageGenerationContext = {
            product,
            visualCharacteristics,
            referenceImages: product.images
        };

        const generatedImages: GeneratedImage[] = [];

        // 3. Generate MAIN Image
        let mainImage = await this.baseGenerator.generateMainImage(context);
        mainImage.url = await this.backgroundProcessor.applyPureWhiteBackground(mainImage.url);
        mainImage.url = await this.resolutionEnhancer.enhance(mainImage.url);
        generatedImages.push(await this.processAndScore(mainImage, context));

        // 4. Generate BENEFITS Infographic
        let benefitsImage = await this.infographicGenerator.generate(context, 'BENEFITS', visionReqs.keySellingPoints);
        benefitsImage.url = await this.resolutionEnhancer.enhance(benefitsImage.url);
        generatedImages.push(await this.processAndScore(benefitsImage, context));

        // 5. Generate LIFESTYLE Image
        let lifestyleImage = await this.lifestyleGenerator.generate(context, visionReqs.environments[0] || 'modern home');
        lifestyleImage.url = await this.resolutionEnhancer.enhance(lifestyleImage.url);
        generatedImages.push(await this.processAndScore(lifestyleImage, context));

        // 6. Generate DIMENSIONS Image
        let dimensionsImage = await this.dimensionGenerator.generate(context);
        dimensionsImage.url = await this.resolutionEnhancer.enhance(dimensionsImage.url);
        generatedImages.push(await this.processAndScore(dimensionsImage, context));

        return generatedImages;
    }

    private async processAndScore(image: GeneratedImage, context: ImageGenerationContext): Promise<GeneratedImage> {
        // Validate against Amazon TOS
        const validation = this.validator.validate(image);
        if (!validation.isValid) {
            // In a real scenario, we would trigger a retry loop here
            console.warn(`Image validation failed for type ${image.type}:`, validation.violations);
        }

        // Score the image
        image.score = await this.qualityAnalyzer.evaluate(image, context.visualCharacteristics);

        return image;
    }
}
