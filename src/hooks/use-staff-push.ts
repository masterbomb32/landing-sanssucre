import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getVapidPublicKey,
  registerStaffPush,
  unregisterStaffPush,
} from "@/lib/push.functions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type Status = "idle" | "loading" | "subscribed" | "unsupported" | "denied";

export function useStaffPush() {
  const [status, setStatus] = useState<Status>("idle");
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "default">(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const getKey = useServerFn(getVapidPublicKey);
  const registerFn = useServerFn(registerStaffPush);
  const unregisterFn = useServerFn(unregisterStaffPush);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined";

  const refresh = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setPermission(Notification.permission);
      if (Notification.permission === "denied") setStatus("denied");
      else setStatus(existing ? "subscribed" : "idle");
    } catch {
      setStatus("idle");
    }
  }, [isSupported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!isSupported) return { ok: false, error: "unsupported" as const };
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "idle");
        return { ok: false, error: "permission" as const };
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await getKey();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const keyBytes = urlBase64ToUint8Array(publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes.buffer.slice(
            keyBytes.byteOffset,
            keyBytes.byteOffset + keyBytes.byteLength,
          ) as ArrayBuffer,
        });
      }
      const json = sub.toJSON();
      const p256dh =
        json.keys?.p256dh ??
        arrayBufferToBase64(sub.getKey("p256dh"));
      const auth =
        json.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth"));
      await registerFn({
        data: {
          endpoint: sub.endpoint,
          p256dh,
          auth,
          userAgent: navigator.userAgent.slice(0, 500),
        },
      });
      setStatus("subscribed");
      return { ok: true as const };
    } catch (e) {
      console.error("enable push", e);
      return { ok: false, error: "error" as const };
    } finally {
      setBusy(false);
    }
  }, [isSupported, getKey, registerFn]);

  const disable = useCallback(async () => {
    if (!isSupported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unregisterFn({ data: { endpoint: sub.endpoint } }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setStatus("idle");
    } finally {
      setBusy(false);
    }
  }, [isSupported, unregisterFn]);

  return { status, busy, permission, isSupported, enable, disable, refresh };
}