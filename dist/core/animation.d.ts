import type { AnimationController, LottieData, RendererConfig } from "../types";
/**
 * Main animation controller that manages playback and rendering
 */
export declare class Animation implements AnimationController {
    private renderer;
    private animationData;
    private currentFrame;
    private _isPlaying;
    private _isPaused;
    private _isStopped;
    private direction;
    private speed;
    private loop;
    private autoplay;
    private useSubFrames;
    private segments;
    private frameRate;
    private totalFrames;
    private inPoint;
    private outPoint;
    private animationId;
    private lastFrameTime;
    private frameInterval;
    private eventListeners;
    constructor(config: RendererConfig);
    /**
     * Play animation
     */
    play(): void;
    /**
     * Pause animation
     */
    pause(): void;
    /**
     * Stop animation and reset to beginning
     */
    stop(): void;
    /**
     * Seek to specific progress (0-1)
     */
    seek(progress: number): void;
    /**
     * Go to specific frame and play
     */
    goToAndPlay(frame: number): void;
    /**
     * Go to specific frame and stop
     */
    goToAndStop(frame: number): void;
    /**
     * Play specific segments
     */
    playSegments(segments: [number, number], forceFlag?: boolean): void;
    /**
     * Set animation speed
     */
    setSpeed(speed: number): void;
    /**
     * Set animation direction
     */
    setDirection(direction: 1 | -1): void;
    /**
     * Set subframe usage
     */
    setSubframe(useSubFrames: boolean): void;
    /**
     * Resize animation
     */
    resize(): void;
    /**
     * Destroy animation and clean up resources
     */
    destroy(): void;
    /**
     * Add event listener
     */
    addEventListener(event: string, callback: Function): void;
    /**
     * Remove event listener
     */
    removeEventListener(event: string, callback: Function): void;
    /**
     * Get current frame
     */
    getCurrentFrame(): number;
    /**
     * Get total frames
     */
    getTotalFrames(): number;
    /**
     * Get frame rate
     */
    getFrameRate(): number;
    /**
     * Get duration in milliseconds
     */
    getDuration(): number;
    /**
     * Get current progress (0-1)
     */
    getProgress(): number;
    /**
     * Check if animation is playing
     */
    isPlaying(): boolean;
    /**
     * Check if animation is paused
     */
    isPaused(): boolean;
    /**
     * Check if animation is stopped
     */
    isStopped(): boolean;
    /**
     * Start animation loop
     */
    private startAnimation;
    /**
     * Update current frame
     */
    private updateFrame;
    /**
     * Render current frame
     */
    private renderFrame;
    /**
     * Dispatch event to listeners
     */
    private dispatchEvent;
    /**
     * Get animation data
     */
    getAnimationData(): LottieData;
    /**
     * Check if animation has loaded
     */
    isLoaded(): boolean;
    /**
     * Get renderer type
     */
    getRendererType(): "canvas" | "svg";
    /**
     * Set loop mode
     */
    setLoop(loop: boolean): void;
    /**
     * Get loop mode
     */
    getLoop(): boolean;
    /**
     * Get speed
     */
    getSpeed(): number;
    /**
     * Get direction
     */
    getDirection(): number;
    /**
     * Get segments
     */
    getSegments(): [number, number] | null;
    /**
     * Clear segments
     */
    clearSegments(): void;
    /**
     * Get in point
     */
    getInPoint(): number;
    /**
     * Get out point
     */
    getOutPoint(): number;
}
//# sourceMappingURL=animation.d.ts.map