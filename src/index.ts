// Core exports
export { LottieParser } from "./core/parser";
export { CanvasRenderer } from "./core/renderer-canvas";
export { SVGRenderer } from "./core/renderer-svg";
export { Animation } from "./core/animation";

// React exports
export { LottiePlayer } from "./react/LottiePlayer";
export {
  useLottie,
  useSimpleLottie,
  useLazyLottie,
  useScrollLottie,
  useHoverLottie,
} from "./react/useLottie";

// Utility exports
export { LottieLoader } from "./utils/loader";
export {
  PerformanceMonitor,
  LazyLoadManager,
  FrameRateLimiter,
  MemoryMonitor,
  DeviceDetector,
  OptimizationUtils,
} from "./utils/performance";

// Type exports
export type {
  LottieData,
  Layer,
  Shape,
  AnimatableValue,
  Transform,
  LottiePlayerProps,
  UseLottieOptions,
  UseLottieReturn,
  AnimationController,
  RendererConfig,
  ParsedAnimation,
  ParserOptions,
  PerformanceMetrics,
  LottieEventType,
  LottieEvent,
  LoaderOptions,
  LoaderResult,
  RendererSettings,
} from "./types";

// Default export for convenience
export { LottiePlayer as default } from "./react/LottiePlayer";
