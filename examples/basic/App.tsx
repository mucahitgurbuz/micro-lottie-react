import React from "react";
import { LottiePlayer } from "micro-lottie-react";

/**
 * Basic usage example
 */
export function BasicExample() {
  return (
    <div style={{ width: 300, height: 300 }}>
      <LottiePlayer
        src="/animations/loading.lottie"
        autoplay
        loop
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/**
 * Advanced controls example
 */
export function AdvancedExample() {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState(1);
  const playerRef = React.useRef<any>(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    // Speed is controlled by the component prop, not the ref
  };

  const handleSeek = (progress: number) => {
    playerRef.current?.seek(progress);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ width: 400, height: 400, marginBottom: "20px" }}>
        <LottiePlayer
          ref={playerRef}
          src="/animations/hero-animation.json"
          autoplay={isPlaying}
          speed={speed}
          loop
          style={{ width: "100%", height: "100%" }}
          onComplete={() => console.log("Animation completed!")}
          onProgress={(progress) =>
            console.log(`Progress: ${Math.round(progress * 100)}%`)
          }
        />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={handlePlayPause}>
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>

        <button onClick={() => playerRef.current?.stop()}>⏹️ Stop</button>

        <label>
          Speed:
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          />
          {speed}x
        </label>

        <label>
          Seek:
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Performance comparison example
 */
export function PerformanceExample() {
  const [renderer, setRenderer] = React.useState<"canvas" | "svg">("canvas");
  const [metrics, setMetrics] = React.useState<string>("");

  React.useEffect(() => {
    // Simulate performance monitoring
    const interval = setInterval(() => {
      if ("memory" in performance) {
        const memInfo = (performance as any).memory;
        const usage = (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
        setMetrics(`Memory: ${usage}MB`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h3>Performance Comparison</h3>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Renderer:
          <select
            value={renderer}
            onChange={(e) => setRenderer(e.target.value as "canvas" | "svg")}
          >
            <option value="canvas">
              Canvas (Better for complex animations)
            </option>
            <option value="svg">SVG (Better for simple animations)</option>
          </select>
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ width: 200, height: 200 }}>
            <LottiePlayer
              src="/animations/simple-icon.lottie"
              renderer={renderer}
              autoplay
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        {metrics}
      </div>
    </div>
  );
}

/**
 * Lazy loading example
 */
export function LazyLoadingExample() {
  return (
    <div style={{ padding: "20px" }}>
      <h3>Lazy Loading Demo</h3>
      <p>Scroll down to see animations load only when they come into view.</p>

      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ width: 300, height: 300 }}>
            <LottiePlayer
              src={`/animations/animation-${i + 1}.lottie`}
              autoplay
              loop
              style={{ width: "100%", height: "100%" }}
              onLoad={() => console.log(`Animation ${i + 1} loaded!`)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Interactive hover example
 */
export function InteractiveExample() {
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  const cards = [
    { id: 1, title: "Like", animation: "/animations/like.lottie" },
    { id: 2, title: "Share", animation: "/animations/share.lottie" },
    { id: 3, title: "Comment", animation: "/animations/comment.lottie" },
    { id: 4, title: "Bookmark", animation: "/animations/bookmark.lottie" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h3>Interactive Hover Effects</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              padding: "20px",
              border: "2px solid #eee",
              borderRadius: "10px",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s",
              transform: hoveredCard === card.id ? "scale(1.05)" : "scale(1)",
            }}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ width: 80, height: 80, margin: "0 auto 10px" }}>
              <LottiePlayer
                src={card.animation}
                autoplay={hoveredCard === card.id}
                loop={false}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <h4>{card.title}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format comparison example
 */
export function FormatComparisonExample() {
  const [format, setFormat] = React.useState<"json" | "lottie">("lottie");

  return (
    <div style={{ padding: "20px" }}>
      <h3>Format Comparison</h3>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Format:
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "json" | "lottie")}
          >
            <option value="lottie">.lottie (Smaller, faster)</option>
            <option value="json">.json (Traditional)</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: "40px" }}>
        <div style={{ flex: 1 }}>
          <h4>.lottie Format</h4>
          <div style={{ width: 300, height: 300, marginBottom: "10px" }}>
            <LottiePlayer
              src="/animations/comparison.lottie"
              autoplay
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Size: 45KB
            <br />
            Load time: ~80ms
            <br />
            Parse time: ~12ms
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4>.json Format</h4>
          <div style={{ width: 300, height: 300, marginBottom: "10px" }}>
            <LottiePlayer
              src="/animations/comparison.json"
              autoplay
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Size: 89KB
            <br />
            Load time: ~150ms
            <br />
            Parse time: ~28ms
          </div>
        </div>
      </div>
    </div>
  );
}
