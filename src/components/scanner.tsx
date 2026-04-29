import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import * as zxingLib from "@zxing/library";
import { Camera, CameraOff, Flashlight, FlashlightOff } from "lucide-react";

const { DecodeHintType, BarcodeFormat } = zxingLib;

interface Props {
  onResult: (text: string) => void;
  paused?: boolean;
}

/**
 * Camera-based scanner that reads QR codes and Code-128 barcodes.
 * Uses the back camera on phones. Calls onResult with the decoded text.
 * Parent should briefly set `paused` true after handling a scan to avoid
 * re-firing for the same frame.
 */
export function Scanner({ onResult, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const pausedRef = useRef(!!paused);
  const lastResultRef = useRef<{ text: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    // QR-only hints. TRY_HARDER off — we crop to a small center region instead,
    // which is much faster per frame and matches the "aim at the box" UX.
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    const reader = new BrowserQRCodeReader(hints);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("This browser does not support camera access. Use manual entry below.");
          return;
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });
        } catch (err: any) {
          if (err?.name === "OverconstrainedError" || err?.name === "NotReadableError") {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } else {
            throw err;
          }
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track ?? null;
        // Continuous autofocus (best-effort)
        try {
          await track?.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] });
        } catch {
          /* not supported */
        }
        // Torch detection
        try {
          const caps: any = track?.getCapabilities?.() ?? {};
          if (caps.torch) setTorchSupported(true);
        } catch {
          /* noop */
        }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        v.setAttribute("playsinline", "true");
        v.muted = true;
        try {
          await v.play();
          setReady(true);
        } catch {
          setNeedsTap(true);
        }

        // Manual decode loop on a small center-cropped canvas (~512px square).
        // Decoding a small region is dramatically faster than full-frame.
        const canvas = canvasRef.current ?? document.createElement("canvas");
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const TARGET = 512;
        canvas.width = TARGET;
        canvas.height = TARGET;

        const tick = () => {
          if (cancelled) return;
          if (pausedRef.current || v.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          const vw = v.videoWidth;
          const vh = v.videoHeight;
          if (vw && vh) {
            // Square center crop
            const side = Math.min(vw, vh);
            const sx = (vw - side) / 2;
            const sy = (vh - side) / 2;
            try {
              ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET, TARGET);
              const result = reader.decodeFromCanvas(canvas);
              if (result) {
                const text = result.getText().trim().toUpperCase();
                const last = lastResultRef.current;
                const now = Date.now();
                if (text && (!last || last.text !== text || now - last.at >= 1500)) {
                  lastResultRef.current = { text, at: now };
                  setFlash(true);
                  setTimeout(() => setFlash(false), 250);
                  onResult(text);
                }
              }
            } catch {
              // No code in frame — normal, keep scanning.
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e: any) {
        const name = e?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError("Camera access denied. Allow camera permission, or use manual entry below.");
        } else if (name === "NotFoundError") {
          setError("No camera found on this device. Use manual entry below.");
        } else if (name === "NotReadableError") {
          setError("Camera is in use by another app. Close it and reload.");
        } else if (name === "OverconstrainedError") {
          setError("Camera does not support requested settings. Use manual entry below.");
        } else {
          setError("Could not start the camera. Use manual entry below.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        trackRef.current = null;
      } catch {
        /* noop */
      }
    };
  }, [onResult]);

  const handleTapToStart = async () => {
    try {
      await videoRef.current?.play();
      setNeedsTap(false);
      setReady(true);
    } catch {
      /* still blocked */
    }
  };

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-black">
      <div className="aspect-[16/9] w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>
      {/* Corner brackets overlay */}
      <div
        className={`pointer-events-none absolute inset-x-6 top-1/2 h-40 -translate-y-1/2 rounded-xl border-2 transition-colors ${
          flash ? "border-emerald-400 bg-emerald-400/15" : "border-white/35"
        }`}
      >
        <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-primary/80" />
        <div className={`absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 rounded-tl-md ${flash ? "border-emerald-400" : "border-white/80"}`} />
        <div className={`absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 rounded-tr-md ${flash ? "border-emerald-400" : "border-white/80"}`} />
        <div className={`absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 rounded-bl-md ${flash ? "border-emerald-400" : "border-white/80"}`} />
        <div className={`absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 rounded-br-md ${flash ? "border-emerald-400" : "border-white/80"}`} />
      </div>
      {torchSupported && ready && !error && (
        <button
          type="button"
          onClick={toggleTorch}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur hover:bg-black/70"
          aria-label={torchOn ? "Turn torch off" : "Turn torch on"}
        >
          {torchOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
        </button>
      )}
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
          <Camera className="h-6 w-6 animate-pulse" />
          <span className="text-sm">Starting camera…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center text-white">
          <CameraOff className="h-6 w-6" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {needsTap && !error && (
        <button
          type="button"
          onClick={handleTapToStart}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm font-medium">Tap to start camera</span>
        </button>
      )}
    </div>
  );
}

// Tiny "ding" via Web Audio for scan feedback (no asset).
export function playBeep(success = true) {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = success ? 880 : 220;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.start();
    o.stop(ctx.currentTime + 0.2);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(success ? 60 : [80, 50, 80]);
    }
    setTimeout(() => ctx.close(), 300);
  } catch {
    /* noop */
  }
}