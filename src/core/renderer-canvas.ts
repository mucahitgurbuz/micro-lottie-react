import type {
  LottieData,
  Layer,
  Shape,
  AnimatableValue,
  Transform,
} from "../types";

/**
 * High-performance Canvas renderer for Lottie animations
 * Optimized for mobile devices and complex animations
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationData: LottieData;
  private currentFrame: number = 0;
  private scaleFactor: number = 1;
  private transformMatrix: DOMMatrix;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, animationData: LottieData) {
    this.animationData = animationData;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;

    if (!this.ctx) {
      throw new Error("Canvas 2D context not supported");
    }

    this.setupCanvas(container);
    this.transformMatrix = new DOMMatrix();
  }

  /**
   * Setup canvas element and context
   */
  private setupCanvas(container: HTMLElement): void {
    const { w: width, h: height } = this.animationData;

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Set display size
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";

    // Calculate scale factor for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.scaleFactor = dpr;

    // Scale canvas for high DPI
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    // Optimize rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

    container.appendChild(this.canvas);
  }

  /**
   * Render frame at specific time
   */
  render(frame: number): void {
    if (this.isDestroyed) return;

    this.currentFrame = frame;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    try {
      // Render all layers
      this.renderLayers(this.animationData.layers, frame);
    } catch (error) {
      console.error("Rendering error:", error);
    } finally {
      // Restore context state
      this.ctx.restore();
    }
  }

  /**
   * Render array of layers
   */
  private renderLayers(layers: Layer[], frame: number): void {
    // Sort layers by index for proper rendering order
    const sortedLayers = [...layers].sort((a, b) => a.ind - b.ind);

    for (const layer of sortedLayers) {
      if (this.isLayerVisible(layer, frame)) {
        this.renderLayer(layer, frame);
      }
    }
  }

  /**
   * Check if layer is visible at current frame
   */
  private isLayerVisible(layer: Layer, frame: number): boolean {
    return frame >= layer.ip && frame < layer.op;
  }

  /**
   * Render single layer
   */
  private renderLayer(layer: Layer, frame: number): void {
    this.ctx.save();

    try {
      // Apply layer transform
      this.applyTransform(layer.ks, frame);

      // Apply layer opacity
      const opacity = this.getAnimatedValue(layer.ks.o, frame);
      if (opacity !== undefined) {
        this.ctx.globalAlpha *= opacity / 100;
      }

      // Render based on layer type
      switch (layer.ty) {
        case 4: // Shape layer
          this.renderShapeLayer(layer, frame);
          break;
        case 0: // Precomp layer
          this.renderPrecompLayer(layer, frame);
          break;
        case 1: // Solid layer
          this.renderSolidLayer(layer, frame);
          break;
        case 2: // Image layer
          this.renderImageLayer(layer, frame);
          break;
        case 5: // Text layer
          this.renderTextLayer(layer, frame);
          break;
        default:
          // Unknown layer type, skip
          break;
      }
    } finally {
      this.ctx.restore();
    }
  }

  /**
   * Apply transform to context
   */
  private applyTransform(transform: Transform, frame: number): void {
    // Get animated values
    const anchor = this.getAnimatedValue(transform.a, frame) || [0, 0];
    const position = this.getAnimatedValue(transform.p, frame) || [0, 0];
    const scale = this.getAnimatedValue(transform.s, frame) || [100, 100];
    const rotation = this.getAnimatedValue(transform.r, frame) || 0;

    // Apply transformations in correct order
    this.ctx.translate(position[0], position[1]);
    this.ctx.rotate((rotation * Math.PI) / 180);
    this.ctx.scale(scale[0] / 100, scale[1] / 100);
    this.ctx.translate(-anchor[0], -anchor[1]);
  }

  /**
   * Render shape layer
   */
  private renderShapeLayer(layer: Layer, frame: number): void {
    if (!layer.shapes) return;

    for (const shape of layer.shapes) {
      this.renderShape(shape, frame);
    }
  }

  /**
   * Render shape
   */
  private renderShape(shape: Shape, frame: number): void {
    if (shape.hd) return; // Skip hidden shapes

    this.ctx.save();

    try {
      switch (shape.ty) {
        case "gr": // Group
          this.renderShapeGroup(shape, frame);
          break;
        case "rc": // Rectangle
          this.renderRectangle(shape, frame);
          break;
        case "el": // Ellipse
          this.renderEllipse(shape, frame);
          break;
        case "sh": // Path
          this.renderPath(shape, frame);
          break;
        case "fl": // Fill
          this.applyFill(shape, frame);
          break;
        case "st": // Stroke
          this.applyStroke(shape, frame);
          break;
        case "tr": // Transform
          this.applyShapeTransform(shape, frame);
          break;
        default:
          // Unknown shape type
          break;
      }
    } finally {
      this.ctx.restore();
    }
  }

  /**
   * Render shape group
   */
  private renderShapeGroup(shape: Shape, frame: number): void {
    if (!shape.it) return;

    // Render all items in the group
    for (const item of shape.it) {
      this.renderShape(item, frame);
    }
  }

  /**
   * Render rectangle
   */
  private renderRectangle(shape: Shape, frame: number): void {
    const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
    const roundness = this.getAnimatedValue(shape.r, frame) || 0;

    const [width, height] = size;
    const [x, y] = position;

    this.ctx.beginPath();

    if (roundness > 0) {
      this.ctx.roundRect(
        x - width / 2,
        y - height / 2,
        width,
        height,
        roundness
      );
    } else {
      this.ctx.rect(x - width / 2, y - height / 2, width, height);
    }
  }

  /**
   * Render ellipse
   */
  private renderEllipse(shape: Shape, frame: number): void {
    const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];

    const [width, height] = size;
    const [x, y] = position;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  }

  /**
   * Render path
   */
  private renderPath(shape: Shape, frame: number): void {
    const pathData = this.getAnimatedValue(shape.pt, frame);
    if (!pathData || !pathData.v) return;

    const vertices = pathData.v;
    const inTangents = pathData.i || [];
    const outTangents = pathData.o || [];
    const closed = pathData.c || false;

    this.ctx.beginPath();

    if (vertices.length > 0) {
      this.ctx.moveTo(vertices[0][0], vertices[0][1]);

      for (let i = 1; i < vertices.length; i++) {
        const prevVertex = vertices[i - 1];
        const currentVertex = vertices[i];
        const prevOutTangent = outTangents[i - 1] || [0, 0];
        const currentInTangent = inTangents[i] || [0, 0];

        this.ctx.bezierCurveTo(
          prevVertex[0] + prevOutTangent[0],
          prevVertex[1] + prevOutTangent[1],
          currentVertex[0] + currentInTangent[0],
          currentVertex[1] + currentInTangent[1],
          currentVertex[0],
          currentVertex[1]
        );
      }

      if (closed && vertices.length > 2) {
        const lastVertex = vertices[vertices.length - 1];
        const firstVertex = vertices[0];
        const lastOutTangent = outTangents[vertices.length - 1] || [0, 0];
        const firstInTangent = inTangents[0] || [0, 0];

        this.ctx.bezierCurveTo(
          lastVertex[0] + lastOutTangent[0],
          lastVertex[1] + lastOutTangent[1],
          firstVertex[0] + firstInTangent[0],
          firstVertex[1] + firstInTangent[1],
          firstVertex[0],
          firstVertex[1]
        );

        this.ctx.closePath();
      }
    }
  }

  /**
   * Apply fill style
   */
  private applyFill(shape: Shape, frame: number): void {
    const color = this.getAnimatedValue(shape.c, frame);
    const opacity = this.getAnimatedValue(shape.o, frame);

    if (color) {
      const [r, g, b] = color.map((c: number) => Math.round(c * 255));
      const a = opacity ? opacity / 100 : 1;

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      this.ctx.fill();
    }
  }

  /**
   * Apply stroke style
   */
  private applyStroke(shape: Shape, frame: number): void {
    const color = this.getAnimatedValue(shape.c, frame);
    const opacity = this.getAnimatedValue(shape.o, frame);
    const width = this.getAnimatedValue(shape.w, frame);

    if (color && width) {
      const [r, g, b] = color.map((c: number) => Math.round(c * 255));
      const a = opacity ? opacity / 100 : 1;

      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      this.ctx.lineWidth = width;

      // Set line cap and join
      this.ctx.lineCap = this.getLineCap(shape.lc);
      this.ctx.lineJoin = this.getLineJoin(shape.lj);

      if (shape.ml) {
        this.ctx.miterLimit = shape.ml;
      }

      this.ctx.stroke();
    }
  }

  /**
   * Apply shape transform
   */
  private applyShapeTransform(shape: Shape, frame: number): void {
    // Shape transforms have different property names than layer transforms
    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
    const scale = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const rotation = this.getAnimatedValue(shape.r, frame) || 0;

    this.ctx.translate(position[0], position[1]);
    this.ctx.rotate((rotation * Math.PI) / 180);
    this.ctx.scale(scale[0] / 100, scale[1] / 100);
  }

  /**
   * Render precomp layer
   */
  private renderPrecompLayer(_layer: Layer, _frame: number): void {
    // Find referenced composition
    const comp = this.animationData.assets?.find(
      (asset) => asset.id === _layer.refId
    );
    if (comp && comp.layers) {
      this.renderLayers(comp.layers, _frame);
    }
  }

  /**
   * Render solid layer
   */
  private renderSolidLayer(_layer: Layer, _frame: number): void {
    // Solid layers would have color and dimensions
    // This is a simplified implementation
    this.ctx.fillStyle = "#000000"; // Default black
    this.ctx.fillRect(0, 0, _layer.w || 100, _layer.h || 100);
  }

  /**
   * Render image layer
   */
  private renderImageLayer(_layer: Layer, _frame: number): void {
    // Image rendering would require loading external assets
    // This is a placeholder for image layer implementation
    console.warn("Image layer rendering not implemented");
  }

  /**
   * Render text layer
   */
  private renderTextLayer(_layer: Layer, _frame: number): void {
    // Text rendering would require complex text layout
    // This is a placeholder for text layer implementation
    console.warn("Text layer rendering not implemented");
  }

  /**
   * Get animated value at specific frame
   */
  private getAnimatedValue(
    animatable: AnimatableValue | undefined,
    frame: number
  ): any {
    if (!animatable) return undefined;

    // Static value
    if (!animatable.a) {
      return animatable.k;
    }

    // Animated value
    const keyframes = animatable.k;
    if (!Array.isArray(keyframes)) {
      return keyframes;
    }

    // Find appropriate keyframes
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (frame >= keyframes[i].t && frame < keyframes[i + 1].t) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    // Linear interpolation
    const progress =
      (frame - prevKeyframe.t) / (nextKeyframe.t - prevKeyframe.t);
    return this.interpolateValue(
      prevKeyframe.s,
      nextKeyframe.s,
      Math.max(0, Math.min(1, progress))
    );
  }

  /**
   * Interpolate between two values
   */
  private interpolateValue(start: any, end: any, progress: number): any {
    if (typeof start === "number" && typeof end === "number") {
      return start + (end - start) * progress;
    }

    if (Array.isArray(start) && Array.isArray(end)) {
      return start.map((startVal, index) => {
        const endVal = end[index] || startVal;
        return typeof startVal === "number"
          ? startVal + (endVal - startVal) * progress
          : startVal;
      });
    }

    return progress < 0.5 ? start : end;
  }

  /**
   * Get line cap style
   */
  private getLineCap(cap?: number): CanvasLineCap {
    switch (cap) {
      case 1:
        return "butt";
      case 2:
        return "round";
      case 3:
        return "square";
      default:
        return "butt";
    }
  }

  /**
   * Get line join style
   */
  private getLineJoin(join?: number): CanvasLineJoin {
    switch (join) {
      case 1:
        return "miter";
      case 2:
        return "round";
      case 3:
        return "bevel";
      default:
        return "miter";
    }
  }

  /**
   * Resize canvas
   */
  resize(): void {
    if (this.isDestroyed) return;

    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    // Re-render current frame
    this.render(this.currentFrame);
  }

  /**
   * Destroy renderer and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
