import { WedropProduct } from '../../../infrastructure/services/wedrop/types';

export type AmazonImageType = 
    | 'MAIN' 
    | 'BENEFITS' 
    | 'DIMENSIONS' 
    | 'DETAILS' 
    | 'LIFESTYLE' 
    | 'COMPARATIVE' 
    | 'TECHNICAL' 
    | 'PACKAGING' 
    | 'BOX_CONTENT' 
    | 'FEATURES';

export interface ImageQualityScore {
    resolution: number;
    lighting: number;
    framing: number;
    contrast: number;
    fidelity: number;
    conversionPotential: number;
    amazonCompliance: number;
    overall: number;
    feedback: string[];
}

export interface GeneratedImage {
    url: string; // Base64 or temporary URL in this phase
    type: AmazonImageType;
    score?: ImageQualityScore;
    metadata: Record<string, any>;
}

export interface VisualCharacteristics {
    colors: string[];
    shape: string;
    materials: string[];
    keyVisualFeatures: string[];
    accessories: string[];
}

export interface IAIImageProvider {
    analyzeReferenceImage(imageUrl: string, prompt: string): Promise<VisualCharacteristics>;
    generateImage(prompt: string, referenceImage?: string): Promise<string>;
    editImage(imageUrl: string, prompt: string): Promise<string>;
}

export interface ImageGenerationContext {
    product: WedropProduct;
    visualCharacteristics: VisualCharacteristics;
    referenceImages: string[];
}
