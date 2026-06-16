import { useEffect } from "react";
import { logClientError } from "@/lib/errors.functions";
import { getVisitorId } from "@/lib/visitor";

const RECENT = new Map<string, number>();
const DEDUPE_MS = 10_000;

function shouldSend(key: string): boolean {
  const now = Date.now();
  const last = RECENT.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  RECENT.set(key, now);
  if (RECENT.size > 50) {
    const oldest = [...RECENT.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (oldest) RECENT.delete(oldest);
  }
  return true;
}

function send(message: string, stack?: string, extra?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const key = `${message}::${stack?.slice(0, 200) ?? ""}`;
  if (!shouldSend(key)) return;
  const visitorId = (() => {
    try {
      return getVisitorId();
    } catch {
      return undefined;
    }
  })();
  logClientError({
    data: {
      source: "client",
      level: "error",
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 10000),
      path: window.location.pathname,
      userAgent: navigator.userAgent.slice(0, 500),
      visitorHash: visitorId,
      context: extra,
    },
  }).catch(() => {});
}

export function useErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onError = (e: ErrorEvent) => {
      send(e.message || "window.onerror", e.error?.stack, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      send(message, stack, { type: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
}