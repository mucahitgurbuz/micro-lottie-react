import { useEffect, useState, useCallback, useRef } from "react";
import type { UseLottieOptions, UseLottieReturn, LottieData } from "../types";
import { LottieLoader } from "../utils/loader";
import { LottieParser } from "../core/parser";
import { Animation } from "../core/animation";
import { DeviceDetector, OptimizationUtils } from "../utils/performance";

/**
 * Powerful React hook for Lottie animations
 * Provides fine-grained control over animation playback
 */
export function useLottie(options: UseLottieOptions): UseLottieReturn {
  const {
    container,
    src,
    renderer = "canvas",
    autoplay = true,
    loop = true,
    speed = 1,
    direction = 1,
    segments,
    onComplete,
    onProgress,
    onError,
    onLoad,
    rendererSettings = {},
  } = options;

  const animationRef = useRef<Animation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopped, setIsStopped] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frameRate, setFrameRate] = useState(30);
  const [animationData, setAnimationData] = useState<LottieData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize animation
  useEffect(() => {
    if (!container.current || !src) return;

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

        // Optimize based on device performance
        const deviceDetector = DeviceDetector.getInstance();
        const performanceClass = await deviceDetector.detectPerformance();
        const recommendedSettings = deviceDetector.getRecommendedSettings();

        // Use recommended renderer if device is low-end
        const finalRenderer =
          performanceClass === "low" ? recommendedSettings.renderer : renderer;

        // Create animation instance
        const animation = new Animation({
          container: container.current!,
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
        animation.addEventListener("complete", () => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsStopped(true);
          if (onComplete) onComplete();
        });

        animation.addEventListener("enterFrame", () => {
          const frame = animation.getCurrentFrame();
          const prog = animation.getProgress();

          setCurrentFrame(frame);
          setProgress(prog);

          if (onProgress) onProgress(prog);
        });

        // Store animation reference and update state
        animationRef.current = animation;
        setAnimationData(parsedAnimation.data);
        setTotalFrames(animation.getTotalFrames());
        setDuration(animation.getDuration());
        setFrameRate(animation.getFrameRate());
        setIsLoaded(true);

        // Update playback state
        setIsPlaying(animation.isPlaying());
        setIsPaused(animation.isPaused());
        setIsStopped(animation.isStopped());

        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        if (!isCancelled) {
          const error =
            err instanceof Error ? err : new Error("Failed to load animation");
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
    container,
    src,
    renderer,
    autoplay,
    loop,
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

  // Animation control methods
  const play = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      setIsStopped(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      setIsStopped(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      setIsPlaying(false);
      setIsPaused(false);
      setIsStopped(true);
      setProgress(0);
      setCurrentFrame(0);
    }
  }, []);

  const seek = useCallback(
    (newProgress: number) => {
      if (animationRef.current) {
        const clampedProgress = Math.max(0, Math.min(1, newProgress));
        animationRef.current.seek(clampedProgress);
        setProgress(clampedProgress);

        // Update current frame based on progress
        const frame = Math.round(clampedProgress * totalFrames);
        setCurrentFrame(frame);
      }
    },
    [totalFrames]
  );

  const setSpeedCallback = useCallback((newSpeed: number) => {
    if (animationRef.current) {
      animationRef.current.setSpeed(newSpeed);
    }
  }, []);

  const setDirectionCallback = useCallback((newDirection: 1 | -1) => {
    if (animationRef.current) {
      animationRef.current.setDirection(newDirection);
    }
  }, []);

  const goToAndPlay = useCallback(
    (frame: number) => {
      if (animationRef.current) {
        animationRef.current.goToAndPlay(frame);
        setIsPlaying(true);
        setIsPaused(false);
        setIsStopped(false);

        // Update progress based on frame
        const newProgress = totalFrames > 0 ? frame / totalFrames : 0;
        setProgress(newProgress);
        setCurrentFrame(frame);
      }
    },
    [totalFrames]
  );

  const goToAndStop = useCallback(
    (frame: number) => {
      if (animationRef.current) {
        animationRef.current.goToAndStop(frame);
        setIsPlaying(false);
        setIsPaused(true);
        setIsStopped(false);

        // Update progress based on frame
        const newProgress = totalFrames > 0 ? frame / totalFrames : 0;
        setProgress(newProgress);
        setCurrentFrame(frame);
      }
    },
    [totalFrames]
  );

  const playSegments = useCallback(
    (newSegments: [number, number], forceFlag = false) => {
      if (animationRef.current) {
        animationRef.current.playSegments(newSegments, forceFlag);
        setIsPlaying(true);
        setIsPaused(false);
        setIsStopped(false);
      }
    },
    []
  );

  const setSubframe = useCallback((useSubFrames: boolean) => {
    if (animationRef.current) {
      animationRef.current.setSubframe(useSubFrames);
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = OptimizationUtils.debounce(() => {
      if (animationRef.current) {
        animationRef.current.resize();
      }
    }, 100);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    play,
    pause,
    stop,
    seek,
    setSpeed: setSpeedCallback,
    setDirection: setDirectionCallback,
    goToAndPlay,
    goToAndStop,
    playSegments,
    setSubframe,
    isPlaying,
    isPaused,
    isStopped,
    progress,
    currentFrame,
    totalFrames,
    duration,
    frameRate,
    animationData,
    isLoaded,
    error,
  };
}

/**
 * Simple hook for basic Lottie animations
 * Provides minimal API for common use cases
 */
export function useSimpleLottie(
  src: string,
  options: Partial<UseLottieOptions> = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const lottie = useLottie({
    container: containerRef,
    src,
    ...options,
  });

  return {
    containerRef,
    ...lottie,
  };
}

/**
 * Hook for lazy-loaded Lottie animations
 * Only loads animation when element comes into view
 */
export function useLazyLottie(
  src: string,
  options: Partial<UseLottieOptions> = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading
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

  const lottie = useLottie({
    container: containerRef,
    src: isVisible ? src : "",
    ...options,
  });

  return {
    containerRef,
    isVisible,
    ...lottie,
  };
}

/**
 * Hook for scroll-triggered Lottie animations
 * Animation progress follows scroll position
 */
export function useScrollLottie(
  src: string,
  options: Partial<UseLottieOptions> = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const lottie = useLottie({
    container: containerRef,
    src,
    autoplay: false,
    ...options,
  });

  useEffect(() => {
    const handleScroll = OptimizationUtils.throttle(() => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress when element is in viewport
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const elementHeight = rect.height;
        const visibleHeight =
          Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const progress = visibleHeight / elementHeight;

        setScrollProgress(progress);
        lottie.seek(progress);
      }
    }, 16); // ~60fps

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lottie]);

  return {
    containerRef,
    scrollProgress,
    ...lottie,
  };
}

/**
 * Hook for hover-triggered Lottie animations
 * Plays animation on hover, reverses on leave
 */
export function useHoverLottie(
  src: string,
  options: Partial<UseLottieOptions> = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const lottie = useLottie({
    container: containerRef,
    src,
    autoplay: false,
    loop: false,
    ...options,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
      lottie.setDirection(1);
      lottie.play();
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      lottie.setDirection(-1);
      lottie.play();
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [lottie]);

  return {
    containerRef,
    isHovered,
    ...lottie,
  };
}
