import React from "react";
import type { LottiePlayerProps } from "../types";
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
export declare const LottiePlayer: React.ForwardRefExoticComponent<LottiePlayerProps & React.RefAttributes<LottiePlayerRef>>;
//# sourceMappingURL=LottiePlayer.d.ts.map