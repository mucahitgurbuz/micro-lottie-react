import type { LoaderOptions, LoaderResult } from "../types";
/**
 * Efficient file loader for Lottie animations
 * Supports both .json and .lottie formats with caching and retry logic
 */
export declare class LottieLoader {
    private static cache;
    private static readonly DEFAULT_TIMEOUT;
    private static readonly DEFAULT_RETRY;
    /**
     * Load Lottie animation from URL
     */
    static load(url: string, options?: Partial<LoaderOptions>): Promise<LoaderResult>;
    /**
     * Load animation data from various sources
     */
    static loadFromSource(source: string | ArrayBuffer | object): Promise<LoaderResult>;
    /**
     * Preload animations for better performance
     */
    static preload(urls: string[], options?: Partial<LoaderOptions>): Promise<LoaderResult[]>;
    /**
     * Clear cache to free memory
     */
    static clearCache(): void;
    /**
     * Get cache size information
     */
    static getCacheInfo(): {
        size: number;
        keys: string[];
    };
    /**
     * Remove specific item from cache
     */
    static removeCacheItem(url: string, options?: Partial<LoaderOptions>): boolean;
    /**
     * Perform the actual load operation
     */
    private static performLoad;
    /**
     * Fetch with timeout support
     */
    private static fetchWithTimeout;
    /**
     * Detect file format from URL and response
     */
    private static detectFormat;
    /**
     * Check if string is a URL
     */
    private static isUrl;
    /**
     * Check if error should not be retried
     */
    private static isNonRetryableError;
    /**
     * Create cache key from URL and options
     */
    private static getCacheKey;
    /**
     * Delay helper for retry logic
     */
    private static delay;
    /**
     * Validate loaded animation data
     */
    static validateAnimationData(data: string | ArrayBuffer, format: "json" | "lottie"): boolean;
    /**
     * Check if JSON data is valid Lottie format
     */
    private static isValidLottieJson;
    /**
     * Check if binary data is valid .lottie file
     */
    private static isValidLottieFile;
    /**
     * Get file size in human readable format
     */
    static formatFileSize(bytes: number): string;
    /**
     * Estimate animation complexity
     */
    static estimateComplexity(data: any): "low" | "medium" | "high";
    /**
     * Optimize animation data for better performance
     */
    static optimizeForPerformance(data: any): any;
    /**
     * Round numbers in object to reduce file size
     */
    private static roundNumbers;
}
//# sourceMappingURL=loader.d.ts.map