import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import * as zxingLib from "@zxing/library";
import { Camera, CameraOff } from "lucide-react";

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
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedRef = useRef(!!paused);
  const lastResultRef = useRef<{ text: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, false);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("This browser does not support camera access. Use manual entry below.");
          return;
        }
        // 1. Get the stream ourselves so we control playback.
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (err: any) {
          // Retry without resolution constraints if the device rejected them.
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
        // 2. Now hand the playing video to zxing for continuous decoding.
        const controls = await reader.decodeFromVideoElement(v, (result) => {
          if (!result || pausedRef.current) return;
          const text = result.getText().trim().toUpperCase();
          if (!text) return;
          const last = lastResultRef.current;
          const now = Date.now();
          if (last && last.text === text && now - last.at < 1500) return;
          lastResultRef.current = { text, at: now };
          onResult(text);
        });
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
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
      try {
        controlsRef.current?.stop();
      } catch {
        /* noop */
      }
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/35">
        <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-primary/80" />
        <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white/80 rounded-tl-md" />
        <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white/80 rounded-tr-md" />
        <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white/80 rounded-bl-md" />
        <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white/80 rounded-br-md" />
      </div>
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