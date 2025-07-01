import type { LoaderOptions, LoaderResult } from "../types";

/**
 * Efficient file loader for Lottie animations
 * Supports both .json and .lottie formats with caching and retry logic
 */
export class LottieLoader {
  private static cache = new Map<string, Promise<LoaderResult>>();
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly DEFAULT_RETRY = 3;

  /**
   * Load Lottie animation from URL
   */
  static async load(
    url: string,
    options: Partial<LoaderOptions> = {}
  ): Promise<LoaderResult> {
    const cacheKey = this.getCacheKey(url, options);

    // Return cached result if available
    if (options.cache !== false && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const loadPromise = this.performLoad(url, {
      url,
      method: "GET",
      timeout: this.DEFAULT_TIMEOUT,
      retry: this.DEFAULT_RETRY,
      cache: true,
      ...options,
    } as LoaderOptions);

    // Cache the promise if caching is enabled
    if (options.cache !== false) {
      this.cache.set(cacheKey, loadPromise);
    }

    return loadPromise;
  }

  /**
   * Load animation data from various sources
   */
  static async loadFromSource(
    source: string | ArrayBuffer | object
  ): Promise<LoaderResult> {
    const startTime = performance.now();

    if (typeof source === "string") {
      // URL or JSON string
      if (this.isUrl(source)) {
        return this.load(source);
      } else {
        // JSON string
        return {
          data: source,
          format: "json",
          size: source.length,
          loadTime: performance.now() - startTime,
        };
      }
    } else if (source instanceof ArrayBuffer) {
      // Binary data (.lottie file)
      return {
        data: source,
        format: "lottie",
        size: source.byteLength,
        loadTime: performance.now() - startTime,
      };
    } else if (typeof source === "object") {
      // Animation data object
      const jsonString = JSON.stringify(source);
      return {
        data: jsonString,
        format: "json",
        size: jsonString.length,
        loadTime: performance.now() - startTime,
      };
    }

    throw new Error("Unsupported source type");
  }

  /**
   * Preload animations for better performance
   */
  static async preload(
    urls: string[],
    options: Partial<LoaderOptions> = {}
  ): Promise<LoaderResult[]> {
    const loadPromises = urls.map((url) => this.load(url, options));
    return Promise.all(loadPromises);
  }

  /**
   * Clear cache to free memory
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size information
   */
  static getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove specific item from cache
   */
  static removeCacheItem(
    url: string,
    options: Partial<LoaderOptions> = {}
  ): boolean {
    const cacheKey = this.getCacheKey(url, options);
    return this.cache.delete(cacheKey);
  }

  /**
   * Perform the actual load operation
   */
  private static async performLoad(
    url: string,
    options: LoaderOptions
  ): Promise<LoaderResult> {
    const startTime = performance.now();
    let lastError: Error | null = null;
    const retryCount = options.retry || this.DEFAULT_RETRY;

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const format = this.detectFormat(url, response);
        let data: string | ArrayBuffer;
        let size: number;

        if (format === "lottie") {
          data = await response.arrayBuffer();
          size = data.byteLength;
        } else {
          data = await response.text();
          size = data.length;
        }

        return {
          data,
          format,
          size,
          loadTime: performance.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error as Error)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retryCount - 1) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    throw lastError || new Error("Failed to load animation");
  }

  /**
   * Fetch with timeout support
   */
  private static async fetchWithTimeout(
    url: string,
    options: LoaderOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${options.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Detect file format from URL and response
   */
  private static detectFormat(
    url: string,
    response: Response
  ): "json" | "lottie" {
    // Check file extension
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith(".lottie")) {
      return "lottie";
    }
    if (urlLower.endsWith(".json")) {
      return "json";
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return "json";
    }
    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/zip")
    ) {
      return "lottie";
    }

    // Default to JSON for unknown types
    return "json";
  }

  /**
   * Check if string is a URL
   */
  private static isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      // Check for relative URLs
      return (
        str.startsWith("/") || str.startsWith("./") || str.startsWith("../")
      );
    }
  }

  /**
   * Check if error should not be retried
   */
  private static isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("404") ||
      message.includes("403") ||
      message.includes("401") ||
      message.includes("syntax error") ||
      message.includes("invalid json")
    );
  }

  /**
   * Create cache key from URL and options
   */
  private static getCacheKey(
    url: string,
    options: Partial<LoaderOptions>
  ): string {
    const relevantOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };
    return `${url}:${JSON.stringify(relevantOptions)}`;
  }

  /**
   * Delay helper for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate loaded animation data
   */
  static validateAnimationData(
    data: string | ArrayBuffer,
    format: "json" | "lottie"
  ): boolean {
    try {
      if (format === "json") {
        const parsed = JSON.parse(data as string);
        return this.isValidLottieJson(parsed);
      } else {
        return this.isValidLottieFile(data as ArrayBuffer);
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if JSON data is valid Lottie format
   */
  private static isValidLottieJson(data: any): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      typeof data.v === "string" &&
      typeof data.w === "number" &&
      typeof data.h === "number" &&
      Array.isArray(data.layers)
    );
  }

  /**
   * Check if binary data is valid .lottie file
   */
  private static isValidLottieFile(data: ArrayBuffer): boolean {
    if (data.byteLength < 4) return false;

    const header = new Uint8Array(data.slice(0, 4));
    const zipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

    return header.every((byte, index) => byte === zipSignature[index]);
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Estimate animation complexity
   */
  static estimateComplexity(data: any): "low" | "medium" | "high" {
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return "low";
      }
    }

    if (!data || !Array.isArray(data.layers)) {
      return "low";
    }

    const layerCount = data.layers.length;
    const totalShapes = data.layers.reduce((total: number, layer: any) => {
      return total + (layer.shapes ? layer.shapes.length : 0);
    }, 0);

    if (layerCount < 5 && totalShapes < 10) {
      return "low";
    } else if (layerCount < 20 && totalShapes < 50) {
      return "medium";
    } else {
      return "high";
    }
  }

  /**
   * Optimize animation data for better performance
   */
  static optimizeForPerformance(data: any): any {
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return data;
      }
    }

    const optimized = JSON.parse(JSON.stringify(data));

    // Remove unused assets
    if (optimized.assets) {
      const usedAssets = new Set<string>();

      const findUsedAssets = (layers: any[]) => {
        layers.forEach((layer: any) => {
          if (layer.refId) usedAssets.add(layer.refId);
          if (layer.layers) findUsedAssets(layer.layers);
        });
      };

      findUsedAssets(optimized.layers);
      optimized.assets = optimized.assets.filter((asset: any) =>
        usedAssets.has(asset.id)
      );
    }

    // Round numbers to reduce precision
    this.roundNumbers(optimized, 2);

    return optimized;
  }

  /**
   * Round numbers in object to reduce file size
   */
  private static roundNumbers(obj: any, precision: number = 2): any {
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
        } else if (typeof item === "object" && item !== null) {
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
