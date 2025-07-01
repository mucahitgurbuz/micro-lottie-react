import type {
  LottieData,
  Layer,
  Shape,
  AnimatableValue,
  Transform,
} from "../types";

/**
 * Lightweight SVG renderer for Lottie animations
 * Better for simple animations and better scalability
 */
export class SVGRenderer {
  private container: HTMLElement;
  private svg!: SVGSVGElement; // Will be initialized in setupSVG
  private animationData: LottieData;
  private currentFrame: number = 0;
  private layerElements: Map<number, SVGGElement> = new Map();
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, animationData: LottieData) {
    this.container = container;
    this.animationData = animationData;
    this.setupSVG();
    this.createLayerElements();
  }

  /**
   * Setup SVG element
   */
  private setupSVG(): void {
    const { w: width, h: height } = this.animationData;

    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.style.display = "block";

    this.container.appendChild(this.svg);
  }

  /**
   * Create SVG elements for all layers
   */
  private createLayerElements(): void {
    // Sort layers by index
    const sortedLayers = [...this.animationData.layers].sort(
      (a, b) => a.ind - b.ind
    );

    for (const layer of sortedLayers) {
      const layerGroup = this.createLayerGroup(layer);
      this.layerElements.set(layer.ind, layerGroup);
      this.svg.appendChild(layerGroup);
    }
  }

  /**
   * Create SVG group for layer
   */
  private createLayerGroup(layer: Layer): SVGGElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-layer-index", layer.ind.toString());
    group.setAttribute("data-layer-name", layer.nm || "");

    return group;
  }

  /**
   * Render frame at specific time
   */
  render(frame: number): void {
    if (this.isDestroyed) return;

    this.currentFrame = frame;

    // Update all layers
    for (const layer of this.animationData.layers) {
      this.updateLayer(layer, frame);
    }
  }

  /**
   * Update layer at specific frame
   */
  private updateLayer(layer: Layer, frame: number): void {
    const layerGroup = this.layerElements.get(layer.ind);
    if (!layerGroup) return;

    // Check visibility
    const isVisible = frame >= layer.ip && frame < layer.op;
    layerGroup.style.display = isVisible ? "block" : "none";

    if (!isVisible) return;

    // Apply transform
    const transform = this.getTransformString(layer.ks, frame);
    layerGroup.setAttribute("transform", transform);

    // Apply opacity
    const opacity = this.getAnimatedValue(layer.ks.o, frame);
    if (opacity !== undefined) {
      layerGroup.setAttribute("opacity", (opacity / 100).toString());
    }

    // Update layer content based on type
    switch (layer.ty) {
      case 4: // Shape layer
        this.updateShapeLayer(layer, layerGroup, frame);
        break;
      case 0: // Precomp layer
        this.updatePrecompLayer(layer, layerGroup, frame);
        break;
      case 1: // Solid layer
        this.updateSolidLayer(layer, layerGroup, frame);
        break;
      case 2: // Image layer
        this.updateImageLayer(layer, layerGroup, frame);
        break;
      case 5: // Text layer
        this.updateTextLayer(layer, layerGroup, frame);
        break;
    }
  }

  /**
   * Get transform string from transform object
   */
  private getTransformString(transform: Transform, frame: number): string {
    const transforms: string[] = [];

    // Get animated values
    const anchor = this.getAnimatedValue(transform.a, frame) || [0, 0];
    const position = this.getAnimatedValue(transform.p, frame) || [0, 0];
    const scale = this.getAnimatedValue(transform.s, frame) || [100, 100];
    const rotation = this.getAnimatedValue(transform.r, frame) || 0;

    // Apply transforms in correct order
    if (position[0] !== 0 || position[1] !== 0) {
      transforms.push(`translate(${position[0]}, ${position[1]})`);
    }

    if (rotation !== 0) {
      transforms.push(`rotate(${rotation})`);
    }

    if (scale[0] !== 100 || scale[1] !== 100) {
      transforms.push(`scale(${scale[0] / 100}, ${scale[1] / 100})`);
    }

    if (anchor[0] !== 0 || anchor[1] !== 0) {
      transforms.push(`translate(${-anchor[0]}, ${-anchor[1]})`);
    }

    return transforms.join(" ");
  }

  /**
   * Update shape layer
   */
  private updateShapeLayer(
    layer: Layer,
    layerGroup: SVGGElement,
    frame: number
  ): void {
    if (!layer.shapes) return;

    // Clear existing content
    layerGroup.innerHTML = "";

    // Create shape elements
    for (const shape of layer.shapes) {
      const shapeElement = this.createShapeElement(shape, frame);
      if (shapeElement) {
        layerGroup.appendChild(shapeElement);
      }
    }
  }

  /**
   * Create SVG element for shape
   */
  private createShapeElement(shape: Shape, frame: number): SVGElement | null {
    if (shape.hd) return null; // Skip hidden shapes

    switch (shape.ty) {
      case "gr": // Group
        return this.createShapeGroup(shape, frame);
      case "rc": // Rectangle
        return this.createRectangle(shape, frame);
      case "el": // Ellipse
        return this.createEllipse(shape, frame);
      case "sh": // Path
        return this.createPath(shape, frame);
      default:
        return null;
    }
  }

  /**
   * Create shape group
   */
  private createShapeGroup(shape: Shape, frame: number): SVGGElement | null {
    if (!shape.it) return null;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Process group items
    const pathElements: SVGElement[] = [];
    let fillStyle: string | null = null;
    let strokeStyle: string | null = null;
    let strokeWidth: number | null = null;
    let transform: string | null = null;

    for (const item of shape.it) {
      switch (item.ty) {
        case "sh": // Path
        case "rc": // Rectangle
        case "el": {
          // Ellipse
          const pathElement = this.createShapeElement(item, frame);
          if (pathElement) {
            pathElements.push(pathElement);
          }
          break;
        }
        case "fl": {
          // Fill
          fillStyle = this.getFillStyle(item, frame);
          break;
        }
        case "st": {
          // Stroke
          const strokeInfo = this.getStrokeStyle(item, frame);
          strokeStyle = strokeInfo.style;
          strokeWidth = strokeInfo.width;
          break;
        }
        case "tr": {
          // Transform
          transform = this.getShapeTransformString(item, frame);
          break;
        }
      }
    }

    // Apply styles to path elements
    for (const pathElement of pathElements) {
      if (fillStyle) {
        pathElement.setAttribute("fill", fillStyle);
      } else {
        pathElement.setAttribute("fill", "none");
      }

      if (strokeStyle && strokeWidth) {
        pathElement.setAttribute("stroke", strokeStyle);
        pathElement.setAttribute("stroke-width", strokeWidth.toString());
      }
    }

    // Apply transform
    if (transform) {
      group.setAttribute("transform", transform);
    }

    // Add path elements to group
    for (const pathElement of pathElements) {
      group.appendChild(pathElement);
    }

    return group;
  }

  /**
   * Create rectangle
   */
  private createRectangle(shape: Shape, frame: number): SVGRectElement {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
    const roundness = this.getAnimatedValue(shape.r, frame) || 0;

    const [width, height] = size;
    const [x, y] = position;

    rect.setAttribute("x", (x - width / 2).toString());
    rect.setAttribute("y", (y - height / 2).toString());
    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());

    if (roundness > 0) {
      rect.setAttribute("rx", roundness.toString());
      rect.setAttribute("ry", roundness.toString());
    }

    return rect;
  }

  /**
   * Create ellipse
   */
  private createEllipse(shape: Shape, frame: number): SVGEllipseElement {
    const ellipse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );

    const size = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];

    const [width, height] = size;
    const [x, y] = position;

    ellipse.setAttribute("cx", x.toString());
    ellipse.setAttribute("cy", y.toString());
    ellipse.setAttribute("rx", (width / 2).toString());
    ellipse.setAttribute("ry", (height / 2).toString());

    return ellipse;
  }

  /**
   * Create path
   */
  private createPath(shape: Shape, frame: number): SVGPathElement {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const pathData = this.getAnimatedValue(shape.pt, frame);
    if (pathData && pathData.v) {
      const d = this.buildPathString(pathData);
      path.setAttribute("d", d);
    }

    return path;
  }

  /**
   * Build SVG path string from Lottie path data
   */
  private buildPathString(pathData: any): string {
    const vertices = pathData.v || [];
    const inTangents = pathData.i || [];
    const outTangents = pathData.o || [];
    const closed = pathData.c || false;

    if (vertices.length === 0) return "";

    const pathCommands: string[] = [];

    // Move to first point
    pathCommands.push(`M ${vertices[0][0]} ${vertices[0][1]}`);

    // Add curve commands
    for (let i = 1; i < vertices.length; i++) {
      const prevVertex = vertices[i - 1];
      const currentVertex = vertices[i];
      const prevOutTangent = outTangents[i - 1] || [0, 0];
      const currentInTangent = inTangents[i] || [0, 0];

      const cp1x = prevVertex[0] + prevOutTangent[0];
      const cp1y = prevVertex[1] + prevOutTangent[1];
      const cp2x = currentVertex[0] + currentInTangent[0];
      const cp2y = currentVertex[1] + currentInTangent[1];

      pathCommands.push(
        `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentVertex[0]} ${currentVertex[1]}`
      );
    }

    // Close path if needed
    if (closed && vertices.length > 2) {
      const lastVertex = vertices[vertices.length - 1];
      const firstVertex = vertices[0];
      const lastOutTangent = outTangents[vertices.length - 1] || [0, 0];
      const firstInTangent = inTangents[0] || [0, 0];

      const cp1x = lastVertex[0] + lastOutTangent[0];
      const cp1y = lastVertex[1] + lastOutTangent[1];
      const cp2x = firstVertex[0] + firstInTangent[0];
      const cp2y = firstVertex[1] + firstInTangent[1];

      pathCommands.push(
        `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${firstVertex[0]} ${firstVertex[1]}`
      );
      pathCommands.push("Z");
    }

    return pathCommands.join(" ");
  }

  /**
   * Get fill style string
   */
  private getFillStyle(shape: Shape, frame: number): string | null {
    const color = this.getAnimatedValue(shape.c, frame);
    const opacity = this.getAnimatedValue(shape.o, frame);

    if (!color) return null;

    const [r, g, b] = color.map((c: number) => Math.round(c * 255));
    const a = opacity ? opacity / 100 : 1;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Get stroke style information
   */
  private getStrokeStyle(
    shape: Shape,
    frame: number
  ): { style: string | null; width: number | null } {
    const color = this.getAnimatedValue(shape.c, frame);
    const opacity = this.getAnimatedValue(shape.o, frame);
    const width = this.getAnimatedValue(shape.w, frame);

    if (!color || !width) {
      return { style: null, width: null };
    }

    const [r, g, b] = color.map((c: number) => Math.round(c * 255));
    const a = opacity ? opacity / 100 : 1;

    return {
      style: `rgba(${r}, ${g}, ${b}, ${a})`,
      width: width,
    };
  }

  /**
   * Get shape transform string
   */
  private getShapeTransformString(shape: Shape, frame: number): string {
    const transforms: string[] = [];

    const position = this.getAnimatedValue(shape.p, frame) || [0, 0];
    const scale = this.getAnimatedValue(shape.s, frame) || [100, 100];
    const rotation = this.getAnimatedValue(shape.r, frame) || 0;

    if (position[0] !== 0 || position[1] !== 0) {
      transforms.push(`translate(${position[0]}, ${position[1]})`);
    }

    if (rotation !== 0) {
      transforms.push(`rotate(${rotation})`);
    }

    if (scale[0] !== 100 || scale[1] !== 100) {
      transforms.push(`scale(${scale[0] / 100}, ${scale[1] / 100})`);
    }

    return transforms.join(" ");
  }

  /**
   * Update precomp layer
   */
  private updatePrecompLayer(
    _layer: Layer,
    _layerGroup: SVGGElement,
    _frame: number
  ): void {
    // Find referenced composition
    const comp = this.animationData.assets?.find(
      (asset) => asset.id === _layer.refId
    );
    if (comp && comp.layers) {
      // This would require recursive rendering of the composition
      console.warn("Precomp layer rendering not fully implemented");
    }
  }

  /**
   * Update solid layer
   */
  private updateSolidLayer(
    _layer: Layer,
    _layerGroup: SVGGElement,
    _frame: number
  ): void {
    _layerGroup.innerHTML = "";

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", (_layer.w || 100).toString());
    rect.setAttribute("height", (_layer.h || 100).toString());
    rect.setAttribute("fill", "#000000"); // Default black

    _layerGroup.appendChild(rect);
  }

  /**
   * Update image layer
   */
  private updateImageLayer(
    _layer: Layer,
    _layerGroup: SVGGElement,
    _frame: number
  ): void {
    console.warn("Image layer rendering not implemented");
  }

  /**
   * Update text layer
   */
  private updateTextLayer(
    _layer: Layer,
    _layerGroup: SVGGElement,
    _frame: number
  ): void {
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
   * Resize SVG
   */
  resize(): void {
    // SVG automatically scales with viewBox, no action needed
  }

  /**
   * Destroy renderer and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.layerElements.clear();

    if (this.svg.parentElement) {
      this.svg.parentElement.removeChild(this.svg);
    }
  }

  /**
   * Get SVG element
   */
  getSVG(): SVGSVGElement {
    return this.svg;
  }
}
