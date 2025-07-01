export interface LottieData {
  v: string; // version
  fr: number; // frame rate
  ip: number; // in point
  op: number; // out point
  w: number; // width
  h: number; // height
  nm?: string; // name
  ddd?: number; // 3d flag
  layers: Layer[];
  assets?: Asset[];
  comps?: Composition[];
  markers?: Marker[];
}

export interface Layer {
  ddd?: number; // 3d flag
  ind: number; // index
  ty: number; // type
  nm: string; // name
  sr?: number; // stretch
  ks: Transform; // transform
  ao?: number; // auto orient
  shapes?: Shape[];
  t?: TextData; // text data
  ef?: Effect[]; // effects
  ip: number; // in point
  op: number; // out point
  st: number; // start time
  bm?: number; // blend mode
  parent?: number; // parent layer index
  td?: number; // time remap
  tt?: number; // matte type
  tp?: number; // matte parent
  tm?: AnimatableValue; // time remap
  hasMask?: boolean;
  masksProperties?: Mask[];
  w?: number; // width (for precomp)
  h?: number; // height (for precomp)
  refId?: string; // reference id
}

export interface Transform {
  a?: AnimatableValue; // anchor point
  p?: AnimatableValue; // position
  s?: AnimatableValue; // scale
  r?: AnimatableValue; // rotation
  o?: AnimatableValue; // opacity
  px?: AnimatableValue; // position x
  py?: AnimatableValue; // position y
  pz?: AnimatableValue; // position z
  sk?: AnimatableValue; // skew
  sa?: AnimatableValue; // skew axis
}

export interface AnimatableValue {
  a?: number; // animated flag
  k: any; // keyframes or static value
  ix?: number; // property index
  x?: string; // expression
}

export interface Shape {
  ty: string; // type
  nm?: string; // name
  mn?: string; // match name
  hd?: boolean; // hidden
  d?: number; // direction
  it?: Shape[]; // items
  s?: AnimatableValue; // size
  p?: AnimatableValue; // position
  r?: AnimatableValue; // roundness
  c?: AnimatableValue; // color
  o?: AnimatableValue; // opacity
  w?: AnimatableValue; // stroke width
  lc?: number; // line cap
  lj?: number; // line join
  ml?: number; // miter limit
  bm?: number; // blend mode
  fillEnabled?: boolean;
  pt?: AnimatableValue; // path
}

export interface Asset {
  id: string;
  layers?: Layer[];
  w?: number; // width
  h?: number; // height
  u?: string; // path
  p?: string; // filename
  e?: number; // embedded
}

export interface Composition {
  id: string;
  layers: Layer[];
  w: number; // width
  h: number; // height
  fr: number; // frame rate
  ip: number; // in point
  op: number; // out point
}

export interface Marker {
  tm: number; // time
  cm: string; // comment
  dr: number; // duration
}

export interface TextData {
  d: {
    k: TextKeyframe[];
  };
  p?: any; // path data
  m?: any; // more options
  a?: any[]; // animators
}

export interface TextKeyframe {
  s: TextStyle;
  t: number; // time
}

export interface TextStyle {
  f: string; // font family
  s: number; // font size
  fc: number[]; // fill color
  sc?: number[]; // stroke color
  sw?: number; // stroke width
  of?: boolean; // stroke over fill
  j: number; // justification
  tr: number; // tracking
  lh?: number; // line height
  ls?: number; // baseline shift
  t: string; // text
}

export interface Effect {
  ty: number; // type
  nm: string; // name
  np: number; // number of properties
  mn: string; // match name
  ef: EffectValue[];
}

export interface EffectValue {
  ty: number; // type
  nm: string; // name
  mn: string; // match name
  v: AnimatableValue; // value
}

export interface Mask {
  inv?: boolean; // inverted
  mode: string; // mask mode
  pt: AnimatableValue; // path
  o: AnimatableValue; // opacity
  x?: AnimatableValue; // expansion
}

import { CSSProperties, RefObject } from "react";

// React component prop interfaces
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

// Internal animation controller interfaces
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

// Parser interfaces
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

// Performance monitoring
export interface PerformanceMetrics {
  parseTime: number;
  renderTime: number;
  frameTime: number;
  memoryUsage: number;
  fps: number;
}

// Event types
export type LottieEventType =
  | "complete"
  | "loopComplete"
  | "enterFrame"
  | "segmentStart"
  | "destroy"
  | "config_ready"
  | "data_ready"
  | "loaded_images"
  | "DOMLoaded"
  | "error";

export interface LottieEvent {
  type: LottieEventType;
  currentTime: number;
  totalTime: number;
  direction: number;
}

// Loader interfaces
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
