import React from "react";
import {
  useLottie,
  useSimpleLottie,
  useLazyLottie,
  useScrollLottie,
  useHoverLottie,
} from "micro-lottie-react";

/**
 * Basic useLottie hook example
 */
export function BasicHookExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const {
    play,
    pause,
    stop,
    seek,
    isPlaying,
    progress,
    currentFrame,
    totalFrames,
    isLoaded,
    error,
  } = useLottie({
    container: containerRef,
    src: "/animations/progress-bar.lottie",
    autoplay: false,
    loop: false,
    onComplete: () => console.log("Animation completed!"),
    onProgress: (progress) =>
      console.log(`Progress: ${Math.round(progress * 100)}%`),
  });

  if (error) {
    return <div>Error loading animation: {error.message}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>Basic useLottie Hook</h3>

      <div
        ref={containerRef}
        style={{
          width: 400,
          height: 200,
          border: "1px solid #eee",
          marginBottom: "20px",
        }}
      />

      {isLoaded && (
        <div>
          <div style={{ marginBottom: "10px" }}>
            <button onClick={play} disabled={isPlaying}>
              ▶️ Play
            </button>
            <button onClick={pause} disabled={!isPlaying}>
              ⏸️ Pause
            </button>
            <button onClick={stop}>⏹️ Stop</button>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Seek:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progress}
                onChange={(e) => seek(parseFloat(e.target.value))}
                style={{ marginLeft: "10px" }}
              />
              {Math.round(progress * 100)}%
            </label>
          </div>

          <div style={{ fontSize: "14px", color: "#666" }}>
            Frame: {currentFrame} / {totalFrames}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple hook for quick setup
 */
export function SimpleHookExample() {
  const { containerRef, play, pause, isPlaying, isLoaded } = useSimpleLottie(
    "/animations/loading-spinner.lottie",
    {
      autoplay: true,
      loop: true,
    }
  );

  return (
    <div style={{ padding: "20px" }}>
      <h3>useSimpleLottie Hook</h3>
      <p>Perfect for quick setup with minimal configuration.</p>

      <div
        ref={containerRef}
        style={{
          width: 150,
          height: 150,
          margin: "20px auto",
          border: "1px solid #eee",
        }}
      />

      {isLoaded && (
        <div style={{ textAlign: "center" }}>
          <button onClick={isPlaying ? pause : play}>
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy loading hook example
 */
export function LazyHookExample() {
  const { containerRef, isVisible, isLoaded, isPlaying, play, pause } =
    useLazyLottie("/animations/heavy-animation.lottie", {
      autoplay: true,
      loop: true,
    });

  return (
    <div style={{ padding: "20px" }}>
      <h3>useLazyLottie Hook</h3>
      <p>Animation loads only when it comes into view.</p>

      <div style={{ height: "50vh" }}>
        <p>Scroll down to trigger lazy loading...</p>
      </div>

      <div
        ref={containerRef}
        style={{
          width: 300,
          height: 300,
          border: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!isVisible && <div>Scroll into view to load...</div>}
        {isVisible && !isLoaded && <div>Loading animation...</div>}
      </div>

      {isLoaded && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button onClick={isPlaying ? pause : play}>
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Scroll-triggered animation example
 */
export function ScrollHookExample() {
  const { containerRef, scrollProgress, isLoaded } = useScrollLottie(
    "/animations/scroll-progress.lottie"
  );

  return (
    <div style={{ padding: "20px" }}>
      <h3>useScrollLottie Hook</h3>
      <p>Animation progress follows scroll position.</p>

      <div style={{ height: "50vh", background: "#f5f5f5", padding: "20px" }}>
        <p>Scroll down to see the animation progress...</p>
      </div>

      <div
        ref={containerRef}
        style={{
          width: 400,
          height: 200,
          border: "1px solid #eee",
          position: "sticky",
          top: "20px",
          background: "white",
        }}
      />

      {isLoaded && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          Scroll Progress: {Math.round(scrollProgress * 100)}%
        </div>
      )}

      <div style={{ height: "200vh", background: "#f9f9f9", padding: "20px" }}>
        <p>Keep scrolling to see the animation progress...</p>
      </div>
    </div>
  );
}

/**
 * Hover-triggered animation example
 */
export function HoverHookExample() {
  const { containerRef, isHovered, isLoaded } = useHoverLottie(
    "/animations/button-hover.lottie",
    {
      autoplay: false,
      loop: false,
    }
  );

  return (
    <div style={{ padding: "20px" }}>
      <h3>useHoverLottie Hook</h3>
      <p>Animation plays forward on hover, backward on leave.</p>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {Array.from({ length: 4 }, (_, i) => {
          const { containerRef: cardRef, isHovered: cardHovered } =
            useHoverLottie(`/animations/icon-${i + 1}.lottie`);

          return (
            <div
              key={i}
              ref={cardRef}
              style={{
                width: 100,
                height: 100,
                border: "2px solid #eee",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                transform: cardHovered ? "scale(1.1)" : "scale(1)",
                borderColor: cardHovered ? "#007bff" : "#eee",
              }}
            />
          );
        })}
      </div>

      <div
        ref={containerRef}
        style={{
          width: 200,
          height: 200,
          border: "2px solid #eee",
          borderRadius: "10px",
          margin: "40px auto",
          cursor: "pointer",
          transition: "all 0.2s",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          borderColor: isHovered ? "#007bff" : "#eee",
        }}
      />

      {isLoaded && (
        <div style={{ textAlign: "center", color: "#666" }}>
          {isHovered ? "Playing forward..." : "Hover to animate!"}
        </div>
      )}
    </div>
  );
}

/**
 * Advanced control example with multiple hooks
 */
export function AdvancedHookExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedSegment, setSelectedSegment] = React.useState<
    [number, number] | undefined
  >();

  const {
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setDirection,
    playSegments,
    isPlaying,
    progress,
    currentFrame,
    totalFrames,
    duration,
    frameRate,
    isLoaded,
  } = useLottie({
    container: containerRef,
    src: "/animations/complex-animation.lottie",
    autoplay: false,
    loop: true,
    segments: selectedSegment,
    onComplete: () => console.log("Segment completed!"),
    onProgress: (progress) => {
      // Update progress bar or other UI elements
    },
  });

  const segments = [
    { name: "Intro", range: [0, 60] as [number, number] },
    { name: "Main", range: [60, 180] as [number, number] },
    { name: "Outro", range: [180, 240] as [number, number] },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h3>Advanced useLottie Hook</h3>

      <div
        ref={containerRef}
        style={{
          width: 500,
          height: 300,
          border: "1px solid #eee",
          marginBottom: "20px",
          background: "#fafafa",
        }}
      />

      {isLoaded && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <button onClick={play} disabled={isPlaying}>
              ▶️ Play
            </button>
            <button onClick={pause} disabled={!isPlaying}>
              ⏸️ Pause
            </button>
            <button onClick={stop}>⏹️ Stop</button>
            <button onClick={() => setDirection(1)}>➡️ Forward</button>
            <button onClick={() => setDirection(-1)}>⬅️ Backward</button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>
              Speed:
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                defaultValue="1"
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ marginLeft: "10px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>
              Seek:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progress}
                onChange={(e) => seek(parseFloat(e.target.value))}
                style={{ marginLeft: "10px", width: "200px" }}
              />
              {Math.round(progress * 100)}%
            </label>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <strong>Segments:</strong>
            {segments.map((segment) => (
              <button
                key={segment.name}
                onClick={() => {
                  setSelectedSegment(segment.range);
                  playSegments(segment.range, true);
                }}
                style={{
                  marginLeft: "10px",
                  background:
                    selectedSegment === segment.range ? "#007bff" : "#f8f9fa",
                  color: selectedSegment === segment.range ? "white" : "black",
                  border: "1px solid #dee2e6",
                  padding: "5px 10px",
                  borderRadius: "4px",
                }}
              >
                {segment.name}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedSegment(undefined);
                play();
              }}
              style={{
                marginLeft: "10px",
                padding: "5px 10px",
              }}
            >
              Full Animation
            </button>
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#666",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
            }}
          >
            <div>
              Frame: {currentFrame} / {totalFrames}
            </div>
            <div>Duration: {Math.round(duration)}ms</div>
            <div>FPS: {frameRate}</div>
            <div>Status: {isPlaying ? "Playing" : "Paused"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
