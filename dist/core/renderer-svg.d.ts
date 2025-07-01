import type { LottieData } from "../types";
/**
 * Lightweight SVG renderer for Lottie animations
 * Better for simple animations and better scalability
 */
export declare class SVGRenderer {
    private container;
    private svg;
    private animationData;
    private currentFrame;
    private layerElements;
    private isDestroyed;
    constructor(container: HTMLElement, animationData: LottieData);
    /**
     * Setup SVG element
     */
    private setupSVG;
    /**
     * Create SVG elements for all layers
     */
    private createLayerElements;
    /**
     * Create SVG group for layer
     */
    private createLayerGroup;
    /**
     * Render frame at specific time
     */
    render(frame: number): void;
    /**
     * Update layer at specific frame
     */
    private updateLayer;
    /**
     * Get transform string from transform object
     */
    private getTransformString;
    /**
     * Update shape layer
     */
    private updateShapeLayer;
    /**
     * Create SVG element for shape
     */
    private createShapeElement;
    /**
     * Create shape group
     */
    private createShapeGroup;
    /**
     * Create rectangle
     */
    private createRectangle;
    /**
     * Create ellipse
     */
    private createEllipse;
    /**
     * Create path
     */
    private createPath;
    /**
     * Build SVG path string from Lottie path data
     */
    private buildPathString;
    /**
     * Get fill style string
     */
    private getFillStyle;
    /**
     * Get stroke style information
     */
    private getStrokeStyle;
    /**
     * Get shape transform string
     */
    private getShapeTransformString;
    /**
     * Update precomp layer
     */
    private updatePrecompLayer;
    /**
     * Update solid layer
     */
    private updateSolidLayer;
    /**
     * Update image layer
     */
    private updateImageLayer;
    /**
     * Update text layer
     */
    private updateTextLayer;
    /**
     * Get animated value at specific frame
     */
    private getAnimatedValue;
    /**
     * Interpolate between two values
     */
    private interpolateValue;
    /**
     * Resize SVG
     */
    resize(): void;
    /**
     * Destroy renderer and clean up resources
     */
    destroy(): void;
    /**
     * Get SVG element
     */
    getSVG(): SVGSVGElement;
}
