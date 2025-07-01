export interface LottieData {
    v: string;
    fr: number;
    ip: number;
    op: number;
    w: number;
    h: number;
    nm?: string;
    ddd?: number;
    layers: Layer[];
    assets?: Asset[];
    comps?: Composition[];
    markers?: Marker[];
}
export interface Layer {
    ddd?: number;
    ind: number;
    ty: number;
    nm: string;
    sr?: number;
    ks: Transform;
    ao?: number;
    shapes?: Shape[];
    t?: TextData;
    ef?: Effect[];
    ip: number;
    op: number;
    st: number;
    bm?: number;
    parent?: number;
    td?: number;
    tt?: number;
    tp?: number;
    tm?: AnimatableValue;
    hasMask?: boolean;
    masksProperties?: Mask[];
    w?: number;
    h?: number;
    refId?: string;
}
export interface Transform {
    a?: AnimatableValue;
    p?: AnimatableValue;
    s?: AnimatableValue;
    r?: AnimatableValue;
    o?: AnimatableValue;
    px?: AnimatableValue;
    py?: AnimatableValue;
    pz?: AnimatableValue;
    sk?: AnimatableValue;
    sa?: AnimatableValue;
}
export interface AnimatableValue {
    a?: number;
    k: any;
    ix?: number;
    x?: string;
}
export interface Shape {
    ty: string;
    nm?: string;
    mn?: string;
    hd?: boolean;
    d?: number;
    it?: Shape[];
    s?: AnimatableValue;
    p?: AnimatableValue;
    r?: AnimatableValue;
    c?: AnimatableValue;
    o?: AnimatableValue;
    w?: AnimatableValue;
    lc?: number;
    lj?: number;
    ml?: number;
    bm?: number;
    fillEnabled?: boolean;
    pt?: AnimatableValue;
}
export interface Asset {
    id: string;
    layers?: Layer[];
    w?: number;
    h?: number;
    u?: string;
    p?: string;
    e?: number;
}
export interface Composition {
    id: string;
    layers: Layer[];
    w: number;
    h: number;
    fr: number;
    ip: number;
    op: number;
}
export interface Marker {
    tm: number;
    cm: string;
    dr: number;
}
export interface TextData {
    d: {
        k: TextKeyframe[];
    };
    p?: any;
    m?: any;
    a?: any[];
}
export interface TextKeyframe {
    s: TextStyle;
    t: number;
}
export interface TextStyle {
    f: string;
    s: number;
    fc: number[];
    sc?: number[];
    sw?: number;
    of?: boolean;
    j: number;
    tr: number;
    lh?: number;
    ls?: number;
    t: string;
}
export interface Effect {
    ty: number;
    nm: string;
    np: number;
    mn: string;
    ef: EffectValue[];
}
export interface EffectValue {
    ty: number;
    nm: string;
    mn: string;
    v: AnimatableValue;
}
export interface Mask {
    inv?: boolean;
    mode: string;
    pt: AnimatableValue;
    o: AnimatableValue;
    x?: AnimatableValue;
}
import { CSSProperties, RefObject } from "react";
export interface LottiePlayerProps {
    src: string;
    autoplay?: boolean;
    loop?: boolean;
    renderer?: "canvas" | "svg";
    speed?: number;
    direction?: 1 | -1;
    segments?: [number, number];
    style?: CSSProperties;
    className?: string;
    onComplete?: () => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onLoad?: () => void;
    preserveAspectRatio?: string;
    rendererSettings?: RendererSettings;
}
export interface RendererSettings {
    clearCanvas?: boolean;
    context?: CanvasRenderingContext2D;
    scaleMode?: "noScale" | "fit" | "fitWidth" | "fitHeight";
    hideOnTransparent?: boolean;
    runExpressions?: boolean;
    className?: string;
}
export interface UseLottieOptions {
    container: RefObject<HTMLElement>;
    src: string;
    renderer?: "canvas" | "svg";
    autoplay?: boolean;
    loop?: boolean;
    speed?: number;
    direction?: 1 | -1;
    segments?: [number, number];
    onComplete?: () => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onLoad?: () => void;
    rendererSettings?: RendererSettings;
}
export interface UseLottieReturn {
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
}
export interface AnimationController {
    play(): void;
    pause(): void;
    stop(): void;
    seek(progress: number): void;
    setSpeed(speed: number): void;
    setDirection(direction: 1 | -1): void;
    goToAndPlay(frame: number): void;
    goToAndStop(frame: number): void;
    playSegments(segments: [number, number], forceFlag?: boolean): void;
    destroy(): void;
    resize(): void;
    setSubframe(useSubFrames: boolean): void;
    addEventListener(event: string, callback: Function): void;
    removeEventListener(event: string, callback: Function): void;
    getCurrentFrame(): number;
    getTotalFrames(): number;
    getFrameRate(): number;
    getDuration(): number;
    getProgress(): number;
    isPlaying(): boolean;
    isPaused(): boolean;
    isStopped(): boolean;
}
export interface RendererConfig {
    container: HTMLElement;
    renderer: "canvas" | "svg";
    loop: boolean;
    autoplay: boolean;
    animationData: LottieData;
    rendererSettings?: RendererSettings;
}
export interface ParsedAnimation {
    data: LottieData;
    duration: number;
    frameRate: number;
    totalFrames: number;
    width: number;
    height: number;
}
export interface ParserOptions {
    format: "json" | "lottie";
    url?: string;
    data?: ArrayBuffer | string;
}
export interface PerformanceMetrics {
    parseTime: number;
    renderTime: number;
    frameTime: number;
    memoryUsage: number;
    fps: number;
}
export type LottieEventType = "complete" | "loopComplete" | "enterFrame" | "segmentStart" | "destroy" | "config_ready" | "data_ready" | "loaded_images" | "DOMLoaded" | "error";
export interface LottieEvent {
    type: LottieEventType;
    currentTime: number;
    totalTime: number;
    direction: number;
}
export interface LoaderOptions {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    timeout?: number;
    retry?: number;
    cache?: boolean;
}
export interface LoaderResult {
    data: ArrayBuffer | string;
    format: "json" | "lottie";
    size: number;
    loadTime: number;
}
//# sourceMappingURL=index.d.ts.map