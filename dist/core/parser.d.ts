import type { LottieData, ParsedAnimation, ParserOptions } from "../types";
/**
 * Ultra-lightweight Lottie parser
 * Parses both JSON and binary .lottie formats without dependencies
 */
export declare class LottieParser {
    private static readonly LOTTIE_MAGIC;
    private static readonly MAX_FILE_SIZE;
    /**
     * Parse Lottie animation data
     */
    static parse(options: ParserOptions): Promise<ParsedAnimation>;
    /**
     * Check if data is in .lottie (binary) format
     */
    private static isLottieFormat;
    /**
     * Parse binary .lottie file (ZIP format)
     */
    private static parseLottieFile;
    /**
     * Parse JSON format
     */
    private static parseJSON;
    /**
     * Find central directory in ZIP file
     */
    private static findCentralDirectory;
    /**
     * Extract animation.json from ZIP central directory
     */
    private static extractAnimationJson;
    /**
     * Read string from DataView
     */
    private static readString;
    /**
     * Validate Lottie data structure
     */
    private static validateLottieData;
    /**
     * Calculate animation duration in milliseconds
     */
    private static calculateDuration;
    /**
     * Compare two Uint8Arrays
     */
    private static arrayEquals;
    /**
     * Optimize animation data for performance
     */
    static optimize(data: LottieData): LottieData;
    /**
     * Remove unused assets to reduce memory usage
     */
    private static removeUnusedAssets;
    /**
     * Simplify complex paths for better performance
     */
    private static simplifyPaths;
    /**
     * Simplify shape items
     */
    private static simplifyShapeItems;
    /**
     * Reduce path complexity by removing redundant points
     */
    private static reducePathComplexity;
    /**
     * Calculate distance from point to line
     */
    private static pointToLineDistance;
    /**
     * Round numbers to reduce precision and file size
     */
    private static roundNumbers;
}
