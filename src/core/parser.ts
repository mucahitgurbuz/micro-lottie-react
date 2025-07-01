import type { LottieData, ParsedAnimation, ParserOptions } from "../types";

/**
 * Ultra-lightweight Lottie parser
 * Parses both JSON and binary .lottie formats without dependencies
 */
export class LottieParser {
  private static readonly LOTTIE_MAGIC = new Uint8Array([
    0x50, 0x4b, 0x03, 0x04,
  ]); // ZIP signature
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

  /**
   * Parse Lottie animation data
   */
  static async parse(options: ParserOptions): Promise<ParsedAnimation> {
    // const startTime = performance.now(); // TODO: Add performance tracking

    try {
      let data: LottieData;

      if (options.format === "lottie" || this.isLottieFormat(options.data)) {
        data = await this.parseLottieFile(options.data as ArrayBuffer);
      } else {
        data = this.parseJSON(options.data as string);
      }

      // const parseTime = performance.now() - startTime; // TODO: Add performance tracking

      return {
        data,
        duration: this.calculateDuration(data),
        frameRate: data.fr || 30,
        totalFrames: data.op - data.ip || 0,
        width: data.w || 512,
        height: data.h || 512,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to parse Lottie animation: ${errorMessage}`);
    }
  }

  /**
   * Check if data is in .lottie (binary) format
   */
  private static isLottieFormat(data: any): boolean {
    if (!data || !(data instanceof ArrayBuffer)) {
      return false;
    }

    const header = new Uint8Array(data.slice(0, 4));
    return this.arrayEquals(header, this.LOTTIE_MAGIC);
  }

  /**
   * Parse binary .lottie file (ZIP format)
   */
  private static async parseLottieFile(
    buffer: ArrayBuffer
  ): Promise<LottieData> {
    if (buffer.byteLength > this.MAX_FILE_SIZE) {
      throw new Error("File too large");
    }

    // Simplified ZIP parsing - extract the main animation.json
    const view = new DataView(buffer);
    // let offset = 0; // TODO: Implement full ZIP parsing if needed

    // Find central directory
    const cdOffset = this.findCentralDirectory(view);
    if (cdOffset === -1) {
      throw new Error("Invalid .lottie file format");
    }

    // Extract animation.json
    const animationData = this.extractAnimationJson(view, cdOffset);
    return JSON.parse(animationData);
  }

  /**
   * Parse JSON format
   */
  private static parseJSON(jsonString: string): LottieData {
    try {
      const data = JSON.parse(jsonString);
      this.validateLottieData(data);
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Invalid JSON format: ${errorMessage}`);
    }
  }

  /**
   * Find central directory in ZIP file
   */
  private static findCentralDirectory(view: DataView): number {
    // Simplified - look for end of central directory signature
    const signature = 0x06054b50;

    for (let i = view.byteLength - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === signature) {
        const cdOffset = view.getUint32(i + 16, true);
        return cdOffset;
      }
    }

    return -1;
  }

  /**
   * Extract animation.json from ZIP central directory
   */
  private static extractAnimationJson(
    view: DataView,
    cdOffset: number
  ): string {
    // Simplified extraction - assumes animation.json is the first file
    const signature = view.getUint32(cdOffset, true);
    if (signature !== 0x02014b50) {
      // Central directory file header signature
      throw new Error("Invalid central directory");
    }

    const fileNameLength = view.getUint16(cdOffset + 28, true);
    const fileName = this.readString(view, cdOffset + 46, fileNameLength);

    if (!fileName.includes("animation.json")) {
      throw new Error("animation.json not found in .lottie file");
    }

    const localHeaderOffset = view.getUint32(cdOffset + 42, true);
    const compressedSize = view.getUint32(cdOffset + 20, true);

    // Skip local file header (30 bytes + filename + extra field)
    const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraFieldLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset =
      localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;

    // Read compressed data (assuming no compression for simplicity)
    return this.readString(view, dataOffset, compressedSize);
  }

  /**
   * Read string from DataView
   */
  private static readString(
    view: DataView,
    offset: number,
    length: number
  ): string {
    const bytes = new Uint8Array(view.buffer, offset, length);
    return new TextDecoder().decode(bytes);
  }

  /**
   * Validate Lottie data structure
   */
  private static validateLottieData(data: any): void {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid Lottie data structure");
    }

    const requiredFields = ["v", "w", "h", "layers"];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(data.layers)) {
      throw new Error("Layers must be an array");
    }

    if (typeof data.w !== "number" || typeof data.h !== "number") {
      throw new Error("Width and height must be numbers");
    }
  }

  /**
   * Calculate animation duration in milliseconds
   */
  private static calculateDuration(data: LottieData): number {
    const frameRate = data.fr || 30;
    const totalFrames = (data.op || 0) - (data.ip || 0);
    return (totalFrames / frameRate) * 1000;
  }

  /**
   * Compare two Uint8Arrays
   */
  private static arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Optimize animation data for performance
   */
  static optimize(data: LottieData): LottieData {
    // Create a deep copy to avoid mutating original data
    const optimized = JSON.parse(JSON.stringify(data));

    // Remove unnecessary properties
    this.removeUnusedAssets(optimized);
    this.simplifyPaths(optimized);
    this.roundNumbers(optimized);

    return optimized;
  }

  /**
   * Remove unused assets to reduce memory usage
   */
  private static removeUnusedAssets(data: LottieData): void {
    if (!data.assets || !Array.isArray(data.assets)) return;

    const usedAssets = new Set<string>();

    // Find used asset IDs in layers
    const findUsedAssets = (layers: any[]) => {
      layers.forEach((layer) => {
        if (layer.refId) usedAssets.add(layer.refId);
        if (layer.layers) findUsedAssets(layer.layers);
      });
    };

    findUsedAssets(data.layers);

    // Filter out unused assets
    data.assets = data.assets.filter((asset) => usedAssets.has(asset.id));
  }

  /**
   * Simplify complex paths for better performance
   */
  private static simplifyPaths(data: LottieData): void {
    // Simplified path optimization
    // In a real implementation, this would intelligently reduce path complexity
    const simplifyLayer = (layer: any) => {
      if (layer.shapes) {
        layer.shapes.forEach((shape: any) => {
          if (shape.it) {
            this.simplifyShapeItems(shape.it);
          }
        });
      }
      if (layer.layers) {
        layer.layers.forEach(simplifyLayer);
      }
    };

    data.layers.forEach(simplifyLayer);
  }

  /**
   * Simplify shape items
   */
  private static simplifyShapeItems(items: any[]): void {
    items.forEach((item) => {
      if (item.ty === "sh" && item.ks && item.ks.k && item.ks.k.v) {
        // Simplify bezier paths by reducing control points
        const vertices = item.ks.k.v;
        if (vertices.length > 100) {
          // Reduce complexity for performance
          item.ks.k.v = this.reducePathComplexity(vertices);
        }
      }
    });
  }

  /**
   * Reduce path complexity by removing redundant points
   */
  private static reducePathComplexity(vertices: number[][]): number[][] {
    if (vertices.length <= 3) return vertices;

    const simplified = [vertices[0]];
    const tolerance = 0.5;

    for (let i = 1; i < vertices.length - 1; i++) {
      const prev = vertices[i - 1];
      const curr = vertices[i];
      const next = vertices[i + 1];

      // Check if current point is significant
      const distance = this.pointToLineDistance(curr, prev, next);
      if (distance > tolerance) {
        simplified.push(curr);
      }
    }

    simplified.push(vertices[vertices.length - 1]);
    return simplified;
  }

  /**
   * Calculate distance from point to line
   */
  private static pointToLineDistance(
    point: number[],
    lineStart: number[],
    lineEnd: number[]
  ): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
    const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Round numbers to reduce precision and file size
   */
  private static roundNumbers(obj: any, precision = 3): any {
    if (typeof obj === "number") {
      return (
        Math.round(obj * Math.pow(10, precision)) / Math.pow(10, precision)
      );
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === "number") {
          obj[index] =
            Math.round(item * Math.pow(10, precision)) /
            Math.pow(10, precision);
        } else if (typeof item === "object") {
          this.roundNumbers(item, precision);
        }
      });
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "number") {
          obj[key] =
            Math.round(obj[key] * Math.pow(10, precision)) /
            Math.pow(10, precision);
        } else if (typeof obj[key] === "object") {
          this.roundNumbers(obj[key], precision);
        }
      });
    }
  }
}
