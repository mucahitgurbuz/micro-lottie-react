import type { PerformanceMetrics } from "../types";
/**
 * Performance monitoring and optimization utilities
 */
export declare class PerformanceMonitor {
    private metrics;
    private frameTimeHistory;
    private lastFrameTime;
    private frameCount;
    private isMonitoring;
    /**
     * Start performance monitoring
     */
    start(): void;
    /**
     * Stop performance monitoring
     */
    stop(): void;
    /**
     * Record frame render time
     */
    recordFrame(): void;
    /**
     * Record parse time
     */
    recordParseTime(time: number): void;
    /**
     * Record render time
     */
    recordRenderTime(time: number): void;
    /**
     * Update performance metrics
     */
    private updateMetrics;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get performance report
     */
    getReport(): string;
    /**
     * Check if performance is good
     */
    isPerformanceGood(): boolean;
    /**
     * Get performance grade
     */
    getPerformanceGrade(): "A" | "B" | "C" | "D" | "F";
}
/**
 * Intersection Observer for lazy loading animations
 */
export declare class LazyLoadManager {
    private observer;
    private callbacks;
    constructor(options?: IntersectionObserverInit);
    /**
     * Observe element for lazy loading
     */
    observe(element: Element, callback: () => void): void;
    /**
     * Stop observing element
     */
    unobserve(element: Element): void;
    /**
     * Handle intersection changes
     */
    private handleIntersection;
    /**
     * Destroy observer
     */
    destroy(): void;
}
/**
 * Frame rate limiting for battery optimization
 */
export declare class FrameRateLimiter {
    private targetFps;
    private frameInterval;
    private lastFrameTime;
    constructor(targetFps?: number);
    /**
     * Check if enough time has passed for next frame
     */
    shouldRender(currentTime?: number): boolean;
    /**
     * Set target FPS
     */
    setTargetFps(fps: number): void;
    /**
     * Get target FPS
     */
    getTargetFps(): number;
}
/**
 * Memory usage monitor
 */
export declare class MemoryMonitor {
    private samples;
    private maxSamples;
    /**
     * Record current memory usage
     */
    sample(): void;
    /**
     * Get current memory usage in MB
     */
    getCurrentUsage(): number;
    /**
     * Get average memory usage
     */
    getAverageUsage(): number;
    /**
     * Get peak memory usage
     */
    getPeakUsage(): number;
    /**
     * Check if memory usage is high
     */
    isMemoryUsageHigh(): boolean;
    /**
     * Clear samples
     */
    clear(): void;
}
/**
 * Device performance detection
 */
export declare class DeviceDetector {
    private static instance;
    private performanceClass;
    static getInstance(): DeviceDetector;
    /**
     * Detect device performance class
     */
    detectPerformance(): Promise<"low" | "medium" | "high">;
    /**
     * Test rendering performance
     */
    private testRenderPerformance;
    /**
     * Get device performance score based on specs
     */
    private getDeviceScore;
    /**
     * Check if device is mobile
     */
    isMobile(): boolean;
    /**
     * Check if device supports hardware acceleration
     */
    supportsHardwareAcceleration(): boolean;
    /**
     * Get recommended settings based on device performance
     */
    getRecommendedSettings(): {
        renderer: "canvas" | "svg";
        quality: "low" | "medium" | "high";
        maxFps: number;
        enableSubFrames: boolean;
    };
}
/**
 * Animation optimization utilities
 */
export declare class OptimizationUtils {
    /**
     * Debounce function for resize events
     */
    static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
    /**
     * Throttle function for scroll events
     */
    static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
    /**
     * Request idle callback polyfill
     */
    static requestIdleCallback(callback: () => void, timeout?: number): ReturnType<typeof setTimeout>;
    /**
     * Cancel idle callback polyfill
     */
    static cancelIdleCallback(id: number): void;
    /**
     * Check if reduced motion is preferred
     */
    static prefersReducedMotion(): boolean;
    /**
     * Check if device is in power save mode
     */
    static isInPowerSaveMode(): boolean;
}
//# sourceMappingURL=performance.d.ts.map