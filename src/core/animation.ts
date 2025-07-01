import type {
  AnimationController,
  LottieData,
  RendererConfig,
  LottieEvent,
  LottieEventType,
} from "../types";
import { CanvasRenderer } from "./renderer-canvas";
import { SVGRenderer } from "./renderer-svg";

/**
 * Main animation controller that manages playback and rendering
 */
export class Animation implements AnimationController {
  private renderer: CanvasRenderer | SVGRenderer;
  private animationData: LottieData;
  private currentFrame: number = 0;
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;
  private _isStopped: boolean = true;
  private direction: number = 1;
  private speed: number = 1;
  private loop: boolean = true;
  private autoplay: boolean = true;
  private useSubFrames: boolean = false;
  private segments: [number, number] | null = null;

  private frameRate: number;
  private totalFrames: number;
  private inPoint: number;
  private outPoint: number;

  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private frameInterval: number;

  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: RendererConfig) {
    this.animationData = config.animationData;
    this.loop = config.loop;
    this.autoplay = config.autoplay;

    // Extract animation properties
    this.frameRate = this.animationData.fr || 30;
    this.inPoint = this.animationData.ip || 0;
    this.outPoint = this.animationData.op || 60;
    this.totalFrames = this.outPoint - this.inPoint;
    this.frameInterval = 1000 / this.frameRate;

    // Create renderer
    if (config.renderer === "svg") {
      this.renderer = new SVGRenderer(config.container, this.animationData);
    } else {
      this.renderer = new CanvasRenderer(config.container, this.animationData);
    }

    // Set initial frame
    this.currentFrame = this.inPoint;

    // Start animation if autoplay is enabled
    if (this.autoplay) {
      this.play();
    } else {
      // Render first frame
      this.renderFrame();
    }
  }

  /**
   * Play animation
   */
  play(): void {
    if (this._isPlaying) return;

    this._isPlaying = true;
    this._isPaused = false;
    this._isStopped = false;

    this.lastFrameTime = performance.now();
    this.startAnimation();

    this.dispatchEvent("complete"); // Use valid event type
  }

  /**
   * Pause animation
   */
  pause(): void {
    if (!this._isPlaying) return;

    this._isPlaying = false;
    this._isPaused = true;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.dispatchEvent("complete"); // Use valid event type
  }

  /**
   * Stop animation and reset to beginning
   */
  stop(): void {
    this._isPlaying = false;
    this._isPaused = false;
    this._isStopped = true;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.currentFrame = this.inPoint;
    this.renderFrame();

    this.dispatchEvent("complete"); // Use valid event type
  }

  /**
   * Seek to specific progress (0-1)
   */
  seek(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const startFrame = this.segments ? this.segments[0] : this.inPoint;
    const endFrame = this.segments ? this.segments[1] : this.outPoint;
    const frameRange = endFrame - startFrame;

    this.currentFrame = startFrame + frameRange * clampedProgress;
    this.renderFrame();

    this.dispatchEvent("enterFrame");
  }

  /**
   * Go to specific frame and play
   */
  goToAndPlay(frame: number): void {
    this.currentFrame = Math.max(this.inPoint, Math.min(this.outPoint, frame));
    this.renderFrame();
    this.play();
  }

  /**
   * Go to specific frame and stop
   */
  goToAndStop(frame: number): void {
    this.currentFrame = Math.max(this.inPoint, Math.min(this.outPoint, frame));
    this.renderFrame();
    this.pause();
  }

  /**
   * Play specific segments
   */
  playSegments(segments: [number, number], forceFlag = false): void {
    this.segments = [
      Math.max(this.inPoint, segments[0]),
      Math.min(this.outPoint, segments[1]),
    ];

    if (forceFlag || !this._isPlaying) {
      this.currentFrame = this.segments[0];
      this.play();
    }
  }

  /**
   * Set animation speed
   */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(5, speed)); // Limit speed between 0.1x and 5x
  }

  /**
   * Set animation direction
   */
  setDirection(direction: 1 | -1): void {
    this.direction = direction;
  }

  /**
   * Set subframe usage
   */
  setSubframe(useSubFrames: boolean): void {
    this.useSubFrames = useSubFrames;
  }

  /**
   * Resize animation
   */
  resize(): void {
    this.renderer.resize();
  }

  /**
   * Destroy animation and clean up resources
   */
  destroy(): void {
    this.stop();
    this.renderer.destroy();
    this.eventListeners.clear();

    this.dispatchEvent("destroy");
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Get total frames
   */
  getTotalFrames(): number {
    return this.totalFrames;
  }

  /**
   * Get frame rate
   */
  getFrameRate(): number {
    return this.frameRate;
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    return (this.totalFrames / this.frameRate) * 1000;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    const startFrame = this.segments ? this.segments[0] : this.inPoint;
    const endFrame = this.segments ? this.segments[1] : this.outPoint;
    const frameRange = endFrame - startFrame;

    if (frameRange === 0) return 0;

    return (this.currentFrame - startFrame) / frameRange;
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Check if animation is paused
   */
  isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Check if animation is stopped
   */
  isStopped(): boolean {
    return this._isStopped;
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    const animate = (currentTime: number) => {
      if (!this._isPlaying) return;

      const deltaTime = currentTime - this.lastFrameTime;
      const expectedFrameTime = this.frameInterval / this.speed;

      if (deltaTime >= expectedFrameTime) {
        this.updateFrame();
        this.renderFrame();
        this.lastFrameTime = currentTime - (deltaTime % expectedFrameTime);
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Update current frame
   */
  private updateFrame(): void {
    const startFrame = this.segments ? this.segments[0] : this.inPoint;
    const endFrame = this.segments ? this.segments[1] : this.outPoint;

    // Update frame based on direction
    if (this.useSubFrames) {
      this.currentFrame += this.direction * this.speed;
    } else {
      this.currentFrame += this.direction;
    }

    // Handle looping
    if (this.direction > 0 && this.currentFrame >= endFrame) {
      if (this.loop) {
        this.currentFrame = startFrame;
        this.dispatchEvent("loopComplete");
      } else {
        this.currentFrame = endFrame - 1;
        this.pause();
        this.dispatchEvent("complete");
      }
    } else if (this.direction < 0 && this.currentFrame <= startFrame) {
      if (this.loop) {
        this.currentFrame = endFrame - 1;
        this.dispatchEvent("loopComplete");
      } else {
        this.currentFrame = startFrame;
        this.pause();
        this.dispatchEvent("complete");
      }
    }

    // Dispatch enterFrame event
    this.dispatchEvent("enterFrame");
  }

  /**
   * Render current frame
   */
  private renderFrame(): void {
    try {
      this.renderer.render(this.currentFrame);
    } catch (error) {
      console.error("Rendering error:", error);
      this.dispatchEvent("error", { error });
    }
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(type: LottieEventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (!listeners) return;

    const event: LottieEvent = {
      type,
      currentTime: this.currentFrame,
      totalTime: this.totalFrames,
      direction: this.direction,
      ...data,
    };

    listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in ${type} event listener:`, error);
      }
    });
  }

  /**
   * Get animation data
   */
  getAnimationData(): LottieData {
    return this.animationData;
  }

  /**
   * Check if animation has loaded
   */
  isLoaded(): boolean {
    return !!this.animationData;
  }

  /**
   * Get renderer type
   */
  getRendererType(): "canvas" | "svg" {
    return this.renderer instanceof CanvasRenderer ? "canvas" : "svg";
  }

  /**
   * Set loop mode
   */
  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  /**
   * Get loop mode
   */
  getLoop(): boolean {
    return this.loop;
  }

  /**
   * Get speed
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * Get direction
   */
  getDirection(): number {
    return this.direction;
  }

  /**
   * Get segments
   */
  getSegments(): [number, number] | null {
    return this.segments;
  }

  /**
   * Clear segments
   */
  clearSegments(): void {
    this.segments = null;
  }

  /**
   * Get in point
   */
  getInPoint(): number {
    return this.inPoint;
  }

  /**
   * Get out point
   */
  getOutPoint(): number {
    return this.outPoint;
  }
}
