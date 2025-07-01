import type { LottieData } from "../types";
/**
 * High-performance Canvas renderer for Lottie animations
 * Optimized for mobile devices and complex animations
 */
export declare class CanvasRenderer {
    private canvas;
    private ctx;
    private animationData;
    private currentFrame;
    private scaleFactor;
    private transformMatrix;
    private isDestroyed;
    constructor(container: HTMLElement, animationData: LottieData);
    /**
     * Setup canvas element and context
     */
    private setupCanvas;
    /**
     * Render frame at specific time
     */
    render(frame: number): void;
    /**
     * Render array of layers
     */
    private renderLayers;
    /**
     * Check if layer is visible at current frame
     */
    private isLayerVisible;
    /**
     * Render single layer
     */
    private renderLayer;
    /**
     * Apply transform to context
     */
    private applyTransform;
    /**
     * Render shape layer
     */
    private renderShapeLayer;
    /**
     * Render shape
     */
    private renderShape;
    /**
     * Render shape group
     */
    private renderShapeGroup;
    /**
     * Render rectangle
     */
    private renderRectangle;
    /**
     * Render ellipse
     */
    private renderEllipse;
    /**
     * Render path
     */
    private renderPath;
    /**
     * Apply fill style
     */
    private applyFill;
    /**
     * Apply stroke style
     */
    private applyStroke;
    /**
     * Apply shape transform
     */
    private applyShapeTransform;
    /**
     * Render precomp layer
     */
    private renderPrecompLayer;
    /**
     * Render solid layer
     */
    private renderSolidLayer;
    /**
     * Render image layer
     */
    private renderImageLayer;
    /**
     * Render text layer
     */
    private renderTextLayer;
    /**
     * Get animated value at specific frame
     */
    private getAnimatedValue;
    /**
     * Interpolate between two values
     */
    private interpolateValue;
    /**
     * Get line cap style
     */
    private getLineCap;
    /**
     * Get line join style
     */
    private getLineJoin;
    /**
     * Resize canvas
     */
    resize(): void;
    /**
     * Destroy renderer and clean up resources
     */
    destroy(): void;
    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement;
}
//# sourceMappingURL=renderer-canvas.d.ts.map