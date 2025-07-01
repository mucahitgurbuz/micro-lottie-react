import type { UseLottieOptions, UseLottieReturn, LottieData } from "../types";
/**
 * Powerful React hook for Lottie animations
 * Provides fine-grained control over animation playback
 */
export declare function useLottie(options: UseLottieOptions): UseLottieReturn;
/**
 * Simple hook for basic Lottie animations
 * Provides minimal API for common use cases
 */
export declare function useSimpleLottie(src: string, options?: Partial<UseLottieOptions>): {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (progress: number) => void;
    setSpeed: (speed: number) => void;
    setDirection: (direction: 1 | -1) => void;
    goToAndPlay: (frame: number) => void;
    goToAndStop: (frame: number) => void;
    playSegments: (segments: [number, number], forceFlag?: boolean) => void;
    setSubframe: (useSubFrames: boolean) => void;
    isPlaying: boolean;
    isPaused: boolean;
    isStopped: boolean;
    progress: number;
    currentFrame: number;
    totalFrames: number;
    duration: number;
    frameRate: number;
    animationData: LottieData | null;
    isLoaded: boolean;
    error: Error | null;
    containerRef: import("react").RefObject<HTMLDivElement>;
};
/**
 * Hook for lazy-loaded Lottie animations
 * Only loads animation when element comes into view
 */
export declare function useLazyLottie(src: string, options?: Partial<UseLottieOptions>): {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (progress: number) => void;
    setSpeed: (speed: number) => void;
    setDirection: (direction: 1 | -1) => void;
    goToAndPlay: (frame: number) => void;
    goToAndStop: (frame: number) => void;
    playSegments: (segments: [number, number], forceFlag?: boolean) => void;
    setSubframe: (useSubFrames: boolean) => void;
    isPlaying: boolean;
    isPaused: boolean;
    isStopped: boolean;
    progress: number;
    currentFrame: number;
    totalFrames: number;
    duration: number;
    frameRate: number;
    animationData: LottieData | null;
    isLoaded: boolean;
    error: Error | null;
    containerRef: import("react").RefObject<HTMLDivElement>;
    isVisible: boolean;
};
/**
 * Hook for scroll-triggered Lottie animations
 * Animation progress follows scroll position
 */
export declare function useScrollLottie(src: string, options?: Partial<UseLottieOptions>): {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (progress: number) => void;
    setSpeed: (speed: number) => void;
    setDirection: (direction: 1 | -1) => void;
    goToAndPlay: (frame: number) => void;
    goToAndStop: (frame: number) => void;
    playSegments: (segments: [number, number], forceFlag?: boolean) => void;
    setSubframe: (useSubFrames: boolean) => void;
    isPlaying: boolean;
    isPaused: boolean;
    isStopped: boolean;
    progress: number;
    currentFrame: number;
    totalFrames: number;
    duration: number;
    frameRate: number;
    animationData: LottieData | null;
    isLoaded: boolean;
    error: Error | null;
    containerRef: import("react").RefObject<HTMLDivElement>;
    scrollProgress: number;
};
/**
 * Hook for hover-triggered Lottie animations
 * Plays animation on hover, reverses on leave
 */
export declare function useHoverLottie(src: string, options?: Partial<UseLottieOptions>): {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (progress: number) => void;
    setSpeed: (speed: number) => void;
    setDirection: (direction: 1 | -1) => void;
    goToAndPlay: (frame: number) => void;
    goToAndStop: (frame: number) => void;
    playSegments: (segments: [number, number], forceFlag?: boolean) => void;
    setSubframe: (useSubFrames: boolean) => void;
    isPlaying: boolean;
    isPaused: boolean;
    isStopped: boolean;
    progress: number;
    currentFrame: number;
    totalFrames: number;
    duration: number;
    frameRate: number;
    animationData: LottieData | null;
    isLoaded: boolean;
    error: Error | null;
    containerRef: import("react").RefObject<HTMLDivElement>;
    isHovered: boolean;
};
//# sourceMappingURL=useLottie.d.ts.map