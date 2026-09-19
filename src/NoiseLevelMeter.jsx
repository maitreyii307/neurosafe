import { useEffect, useRef, useState } from "react";
import "./NoiseLevelMeter.css";

const LEVELS = [
  { max: 30, label: "Quiet", color: "#2e7d32", tag: "Safe" },
  { max: 60, label: "Moderate", color: "#0288d1", tag: "Normal" },
  { max: 100, label: "Loud", color: "#d32f2f", tag: "Caution" },
];

function classify(percent) {
  return LEVELS.find((level) => percent <= level.max) || LEVELS[2];
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);

  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function NoiseLevelMeter() {
  const [status, setStatus] = useState("idle");
  const [level, setLevel] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const historyRef = useRef([]);

  const current = classify(level);

  const stop = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    historyRef.current = [];

    setLevel(0);
    setStatus("idle");

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const drawGraph = (history) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    [0.3, 0.6].forEach((ratio) => {
      const y = height - height * ratio;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    ctx.setLineDash([]);

    if (history.length < 2) return;

    const step = width / (history.length - 1);

    // Waveform
    ctx.beginPath();

    history.forEach((value, index) => {
      const x = index * step;
      const y = height - (value / 100) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "#0288d1";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill
    const lastValue = history[history.length - 1];
    const category = classify(lastValue);

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(
      0,
      hexToRgba(category.color, 0.3)
    );

    gradient.addColorStop(
      1,
      hexToRgba(category.color, 0)
    );

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  const tick = () => {
    const analyser = analyserRef.current;

    if (!analyser) return;

    const data = new Float32Array(analyser.fftSize);

    analyser.getFloatTimeDomainData(data);

    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }

    const rms = Math.sqrt(sum / data.length);

    const percent = Math.min(
      100,
      Math.round(rms * 100 * 2.5)
    );

    setLevel(percent);

    const history = historyRef.current;

    history.push(percent);

    if (history.length > 100) {
      history.shift();
    }

    drawGraph(history);

    animationRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    try {
      // Stop an existing session
      if (streamRef.current || audioContextRef.current) {
        stop();
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setStatus("error");
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStatus("error");
        return;
      }

      const audioContext = new AudioContext();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source =
        audioContext.createMediaStreamSource(stream);

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      historyRef.current = [];

      setStatus("listening");

      tick();
    } catch (error) {
      console.error("Microphone error:", error);

      if (error.name === "NotAllowedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="ns-meter-card">

      <div className="ns-meter-header">
        <div>
          <h2 className="ns-meter-title">
            Noise Level Meter
          </h2>

          <p className="ns-meter-subtitle">
            Real-time ambient sound volume assessment
          </p>
        </div>

        <div className="ns-mic-icon">
          🎙️
        </div>
      </div>

      {status === "idle" && (
        <div className="ns-state">
          <div className="ns-state-icon">
            🎧
          </div>

          <h3>Ready to listen</h3>

          <p>
            Allow microphone access to measure the
            surrounding noise level.
          </p>

          <button
            className="ns-button ns-button-primary"
            onClick={start}
          >
            Start Listening
          </button>
        </div>
      )}

      {status === "denied" && (
        <div className="ns-state ns-error">
          <div className="ns-state-icon">
            🚫
          </div>

          <h3>Microphone Access Denied</h3>

          <p>
            Please allow microphone access in your
            browser settings and try again.
          </p>

          <button
            className="ns-button ns-button-secondary"
            onClick={start}
          >
            Try Again
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="ns-state ns-error">
          <div className="ns-state-icon">
            ⚠️
          </div>

          <h3>Audio Error</h3>

          <p>
            Your microphone could not be initialized.
            Check your microphone and try again.
          </p>

          <button
            className="ns-button ns-button-secondary"
            onClick={start}
          >
            Retry
          </button>
        </div>
      )}

      {status === "listening" && (
        <div className="ns-content">

          <div className="ns-status-card">
            <div className="ns-status-top">
              <span className="ns-status-caption">
                Current Environment
              </span>

              <span
                className="ns-status-tag"
                style={{
                  backgroundColor: current.color,
                }}
              >
                {current.tag}
              </span>
            </div>

            <div
              className="ns-status-value"
              aria-live="polite"
            >
              {current.label}
            </div>

            <div className="ns-level-number">
              {level}
              <span>%</span>
            </div>
          </div>

          <div className="ns-meter-section">
            <div className="ns-meter-label-row">
              <span>Loudness Level</span>

              <span>
                {level}%
              </span>
            </div>

            <div className="ns-level-bar-track">
              <div
                className="ns-level-bar-fill"
                style={{
                  width: `${level}%`,
                  backgroundColor: current.color,
                }}
              />
            </div>

            <div className="ns-scale">
              <span>Quiet</span>
              <span>Moderate</span>
              <span>Loud</span>
            </div>
          </div>

          <div className="ns-canvas-section">
            <div className="ns-canvas-header">
              <span>Noise History</span>

              <span className="ns-live">
                ● LIVE
              </span>
            </div>

            <div className="ns-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                className="ns-canvas"
              />
            </div>
          </div>

          <button
            className="ns-button ns-button-stop"
            onClick={stop}
          >
            Stop Listening
          </button>

        </div>
      )}

      <div className="ns-disclaimer">
        Relative indicator only — not a calibrated dB(A)
        meter. No audio is recorded or stored.
      </div>

    </div>
  );
}