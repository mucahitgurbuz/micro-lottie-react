import type { PerformanceMetrics } from "../types";

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    parseTime: 0,
    renderTime: 0,
    frameTime: 0,
    memoryUsage: 0,
    fps: 0,
  };

  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private isMonitoring: boolean = false;

  /**
   * Start performance monitoring
   */
  start(): void {
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.frameTimeHistory = [];
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isMonitoring = false;
  }

  /**
   * Record frame render time
   */
  recordFrame(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameTimeHistory.push(frameTime);
    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Keep only last 60 frames for FPS calculation
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Update metrics
    this.updateMetrics(frameTime);
  }

  /**
   * Record parse time
   */
  recordParseTime(time: number): void {
    this.metrics.parseTime = time;
  }

  /**
   * Record render time
   */
  recordRenderTime(time: number): void {
    this.metrics.renderTime = time;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(frameTime: number): void {
    this.metrics.frameTime = frameTime;

    // Calculate FPS from frame time history
    if (this.frameTimeHistory.length > 0) {
      const averageFrameTime =
        this.frameTimeHistory.reduce((sum, time) => sum + time, 0) /
        this.frameTimeHistory.length;
      this.metrics.fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
    }

    // Update memory usage if available
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const metrics = this.getMetrics();
    return `
Performance Report:
- Parse Time: ${metrics.parseTime.toFixed(2)}ms
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Frame Time: ${metrics.frameTime.toFixed(2)}ms
- FPS: ${metrics.fps.toFixed(1)}
- Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
    `.trim();
  }

  /**
   * Check if performance is good
   */
  isPerformanceGood(): boolean {
    const metrics = this.getMetrics();
    return metrics.fps >= 55 && metrics.frameTime <= 18; // Target 60fps (16.67ms per frame)
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(): "A" | "B" | "C" | "D" | "F" {
    const metrics = this.getMetrics();

    if (metrics.fps >= 58) return "A";
    if (metrics.fps >= 45) return "B";
    if (metrics.fps >= 30) return "C";
    if (metrics.fps >= 20) return "D";
    return "F";
  }
}

/**
 * Intersection Observer for lazy loading animations
 */
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          rootMargin: "50px",
          threshold: 0.1,
          ...options,
        }
      );
    }
  }

  /**
   * Observe element for lazy loading
   */
  observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      // Fallback for browsers without IntersectionObserver
      callback();
      return;
    }

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  /**
   * Stop observing element
   */
  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.callbacks.delete(element);
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          callback();
          this.unobserve(entry.target);
        }
      }
    });
  }

  /**
   * Destroy observer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks.clear();
  }
}

/**
 * Frame rate limiting for battery optimization
 */
export class FrameRateLimiter {
  private targetFps: number;
  private frameInterval: number;
  private lastFrameTime: number = 0;

  constructor(targetFps: number = 60) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps;
  }

  /**
   * Check if enough time has passed for next frame
   */
  shouldRender(currentTime: number = performance.now()): boolean {
    const elapsed = currentTime - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
      return true;
    }

    return false;
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    this.targetFps = Math.max(1, Math.min(120, fps));
    this.frameInterval = 1000 / this.targetFps;
  }

  /**
   * Get target FPS
   */
  getTargetFps(): number {
    return this.targetFps;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private samples: number[] = [];
  private maxSamples: number = 100;

  /**
   * Record current memory usage
   */
  sample(): void {
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      this.samples.push(memInfo.usedJSHeapSize);

      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
    }
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentUsage(): number {
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Get average memory usage
   */
  getAverageUsage(): number {
    if (this.samples.length === 0) return 0;

    const sum = this.samples.reduce((total, sample) => total + sample, 0);
    return sum / this.samples.length / 1024 / 1024;
  }

  /**
   * Get peak memory usage
   */
  getPeakUsage(): number {
    if (this.samples.length === 0) return 0;

    return Math.max(...this.samples) / 1024 / 1024;
  }

  /**
   * Check if memory usage is high
   */
  isMemoryUsageHigh(): boolean {
    const currentUsage = this.getCurrentUsage();
    return currentUsage > 100; // More than 100MB
  }

  /**
   * Clear samples
   */
  clear(): void {
    this.samples = [];
  }
}

/**
 * Device performance detection
 */
export class DeviceDetector {
  private static instance: DeviceDetector;
  private performanceClass: "low" | "medium" | "high" | null = null;

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  /**
   * Detect device performance class
   */
  async detectPerformance(): Promise<"low" | "medium" | "high"> {
    if (this.performanceClass) {
      return this.performanceClass;
    }

    // Test rendering performance
    const renderScore = await this.testRenderPerformance();

    // Check device specs
    const deviceScore = this.getDeviceScore();

    // Combine scores
    const totalScore = (renderScore + deviceScore) / 2;

    if (totalScore >= 0.8) {
      this.performanceClass = "high";
    } else if (totalScore >= 0.5) {
      this.performanceClass = "medium";
    } else {
      this.performanceClass = "low";
    }

    return this.performanceClass;
  }

  /**
   * Test rendering performance
   */
  private async testRenderPerformance(): Promise<number> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d")!;

      const startTime = performance.now();
      let frameCount = 0;
      const testDuration = 100; // 100ms test

      const animate = () => {
        // Simple animation test
        ctx.clearRect(0, 0, 300, 300);
        ctx.fillStyle = `hsl(${frameCount * 10}, 50%, 50%)`;
        ctx.fillRect(frameCount % 300, 50, 50, 50);

        frameCount++;

        if (performance.now() - startTime < testDuration) {
          requestAnimationFrame(animate);
        } else {
          const fps = frameCount / (testDuration / 1000);
          const score = Math.min(fps / 60, 1); // Normalize to 0-1
          resolve(score);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Get device performance score based on specs
   */
  private getDeviceScore(): number {
    let score = 0.5; // Base score

    // Check CPU cores
    if ("hardwareConcurrency" in navigator) {
      const cores = navigator.hardwareConcurrency;
      score += Math.min(cores / 8, 0.3); // Up to 8 cores = +0.3
    }

    // Check memory
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      const totalMemoryMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
      score += Math.min(totalMemoryMB / 1024, 0.2); // Up to 1GB = +0.2
    }

    // Check device pixel ratio (higher = more work)
    const dpr = window.devicePixelRatio || 1;
    if (dpr <= 1) {
      score += 0.1;
    } else if (dpr >= 3) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Check if device supports hardware acceleration
   */
  supportsHardwareAcceleration(): boolean {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  }

  /**
   * Get recommended settings based on device performance
   */
  getRecommendedSettings(): {
    renderer: "canvas" | "svg";
    quality: "low" | "medium" | "high";
    maxFps: number;
    enableSubFrames: boolean;
  } {
    const performanceClass = this.performanceClass || "medium";
    const isMobile = this.isMobile();

    switch (performanceClass) {
      case "high":
        return {
          renderer: "canvas",
          quality: "high",
          maxFps: 60,
          enableSubFrames: true,
        };
      case "medium":
        return {
          renderer: "canvas",
          quality: "medium",
          maxFps: isMobile ? 30 : 45,
          enableSubFrames: false,
        };
      case "low":
      default:
        return {
          renderer: "svg",
          quality: "low",
          maxFps: 24,
          enableSubFrames: false,
        };
    }
  }
}

/**
 * Animation optimization utilities
 */
export class OptimizationUtils {
  /**
   * Debounce function for resize events
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for scroll events
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Request idle callback polyfill
   */
  static requestIdleCallback(
    callback: () => void,
    timeout = 5000
  ): ReturnType<typeof setTimeout> {
    if ("requestIdleCallback" in window) {
      return window.requestIdleCallback(callback, { timeout }) as any;
    } else {
      return setTimeout(callback, 16);
    }
  }

  /**
   * Cancel idle callback polyfill
   */
  static cancelIdleCallback(id: number): void {
    if ("cancelIdleCallback" in window) {
      window.cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }

  /**
   * Check if reduced motion is preferred
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Check if device is in power save mode
   */
  static isInPowerSaveMode(): boolean {
    // This is a heuristic based on frame rate
    const testStart = performance.now();
    let frameCount = 0;

    return new Promise<boolean>((resolve) => {
      const measure = () => {
        frameCount++;
        if (performance.now() - testStart < 100) {
          requestAnimationFrame(measure);
        } else {
          const fps = frameCount / 0.1; // frames per second
          resolve(fps < 30); // Consider < 30fps as power save mode
        }
      };
      requestAnimationFrame(measure);
    }) as any;
  }
}
