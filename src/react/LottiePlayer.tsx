import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { LottiePlayerProps } from "../types";
import { LottieLoader } from "../utils/loader";
import { LottieParser } from "../core/parser";
import { Animation } from "../core/animation";
import { DeviceDetector, OptimizationUtils } from "../utils/performance";

export interface LottiePlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (progress: number) => void;
  getCurrentFrame: () => number;
  getTotalFrames: () => number;
  getProgress: () => number;
  isPlaying: () => boolean;
  isPaused: () => boolean;
  isStopped: () => boolean;
}

/**
 * Ultra-lightweight React Lottie player component
 * Supports both .json and .lottie formats with zero dependencies
 */
export const LottiePlayer = forwardRef<LottiePlayerRef, LottiePlayerProps>(
  (
    {
      src,
      autoplay = true,
      loop = true,
      renderer = "canvas",
      speed = 1,
      direction = 1,
      segments,
      style,
      className,
      onComplete,
      onProgress,
      onError,
      onLoad,
      preserveAspectRatio: _preserveAspectRatio = "xMidYMid meet", // TODO: Apply to SVG renderer
      rendererSettings = {},
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<Animation | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        play: () => animationRef.current?.play(),
        pause: () => animationRef.current?.pause(),
        stop: () => animationRef.current?.stop(),
        seek: (progress: number) => animationRef.current?.seek(progress),
        getCurrentFrame: () => animationRef.current?.getCurrentFrame() || 0,
        getTotalFrames: () => animationRef.current?.getTotalFrames() || 0,
        getProgress: () => animationRef.current?.getProgress() || 0,
        isPlaying: () => animationRef.current?.isPlaying() || false,
        isPaused: () => animationRef.current?.isPaused() || false,
        isStopped: () => animationRef.current?.isStopped() || true,
      }),
      []
    );

    // Lazy loading with Intersection Observer
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "50px", threshold: 0.1 }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, []);

    // Load and initialize animation
    useEffect(() => {
      if (!isVisible || !containerRef.current) return;

      let isCancelled = false;

      const loadAnimation = async () => {
        try {
          setError(null);

          // Load animation data
          const loaderResult = await LottieLoader.loadFromSource(src);
          if (isCancelled) return;

          // Parse animation data
          const parsedAnimation = await LottieParser.parse({
            data: loaderResult.data,
            format: loaderResult.format,
          });
          if (isCancelled) return;

          // Optimize animation data based on device performance
          const deviceDetector = DeviceDetector.getInstance();
          const performanceClass = await deviceDetector.detectPerformance();
          const recommendedSettings = deviceDetector.getRecommendedSettings();

          // Use recommended renderer if device is low-end
          const finalRenderer =
            performanceClass === "low"
              ? recommendedSettings.renderer
              : (renderer as "canvas" | "svg");

          // Create animation instance
          const animation = new Animation({
            container: containerRef.current!,
            renderer: finalRenderer,
            loop,
            autoplay,
            animationData: parsedAnimation.data,
            rendererSettings,
          });

          if (isCancelled) {
            animation.destroy();
            return;
          }

          // Configure animation
          animation.setSpeed(speed);
          animation.setDirection(direction as 1 | -1);

          if (segments) {
            animation.playSegments(segments);
          }

          // Set up event listeners
          if (onComplete) {
            animation.addEventListener("complete", onComplete);
          }

          if (onProgress) {
            animation.addEventListener("enterFrame", () => {
              onProgress(animation.getProgress());
            });
          }

          // Store animation reference
          animationRef.current = animation;
          setIsLoaded(true);

          if (onLoad) {
            onLoad();
          }
        } catch (err) {
          if (!isCancelled) {
            const error =
              err instanceof Error
                ? err
                : new Error("Failed to load animation");
            setError(error);
            if (onError) {
              onError(error);
            }
          }
        }
      };

      loadAnimation();

      return () => {
        isCancelled = true;
        if (animationRef.current) {
          animationRef.current.destroy();
          animationRef.current = null;
        }
      };
    }, [
      isVisible,
      src,
      autoplay,
      loop,
      renderer,
      rendererSettings,
      onLoad,
      onError,
    ]);

    // Update animation properties when they change
    useEffect(() => {
      if (!animationRef.current) return;

      animationRef.current.setSpeed(speed);
    }, [speed]);

    useEffect(() => {
      if (!animationRef.current) return;

      animationRef.current.setDirection(direction as 1 | -1);
    }, [direction]);

    useEffect(() => {
      if (!animationRef.current) return;

      if (segments) {
        animationRef.current.playSegments(segments);
      } else {
        animationRef.current.clearSegments();
      }
    }, [segments]);

    // Handle resize events
    useEffect(() => {
      const handleResize = OptimizationUtils.debounce(() => {
        if (animationRef.current) {
          animationRef.current.resize();
        }
      }, 100);

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Handle visibility change for performance
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (!animationRef.current) return;

        if (document.hidden) {
          // Pause animation when tab is not visible
          if (animationRef.current.isPlaying()) {
            animationRef.current.pause();
          }
        } else {
          // Resume animation when tab becomes visible
          if (autoplay && animationRef.current.isPaused()) {
            animationRef.current.play();
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
    }, [autoplay]);

    // Handle reduced motion preference
    useEffect(() => {
      if (OptimizationUtils.prefersReducedMotion() && animationRef.current) {
        animationRef.current.pause();
      }
    }, []);

    // Container styles
    const containerStyle: React.CSSProperties = {
      display: "block",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      ...style,
    };

    // Error state
    if (error) {
      return (
        <div
          ref={containerRef}
          className={className}
          style={containerStyle}
          role="img"
          aria-label="Animation failed to load"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "#999",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Failed to load animation
          </div>
        </div>
      );
    }

    // Loading state
    if (!isLoaded && isVisible) {
      return (
        <div
          ref={containerRef}
          className={className}
          style={containerStyle}
          role="img"
          aria-label="Animation loading"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "#999",
              fontSize: "14px",
            }}
          >
            Loading animation...
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
        role="img"
        aria-label="Lottie animation"
      />
    );
  }
);

LottiePlayer.displayName = "LottiePlayer";
