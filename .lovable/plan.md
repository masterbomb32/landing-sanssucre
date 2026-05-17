# Stage 1 — Push notifications

VAPID secrets are saved (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). `staff_push_subscriptions` table already exists. Plan below builds the full subscribe → store → fan-out flow plus a "Send test" button.

## 1. Server functions — `src/lib/push.functions.ts`

All require `requireSupabaseAuth`. New file (kept out of `src/server/` so the client can import the typed RPC stubs).

- `getVapidPublicKey()` — returns `process.env.VAPID_PUBLIC_KEY`. Lets us avoid baking the key into the client bundle.
- `registerStaffPush({ endpoint, p256dh, auth, userAgent })` — upsert into `staff_push_subscriptions` keyed by `endpoint`, set `user_id = auth.uid()`, refresh `last_seen_at`.
- `unregisterStaffPush({ endpoint })` — delete row (RLS already allows self-or-admin).
- `sendStaffPush({ title, body, url })` — admin-only (check `has_role`). Loads all rows via `supabaseAdmin`, signs a VAPID JWT with WebCrypto (P-256 ES256), POSTs an empty/encrypted payload to each `endpoint` with `Authorization: vapid t=<jwt>, k=<pub>`. 404/410 responses → delete the dead subscription. Returns `{ sent, failed, pruned }`.
- `sendTestStaffPush()` — admin-only thin wrapper that calls `sendStaffPush` with a fixed "Test notification from Sans Sucre" payload.

### `src/lib/push.server.ts` (server-only helper)

- `signVapidJwt(audience)` — builds ES256 JWT with `aud`, `exp` (now + 12h), `sub = VAPID_SUBJECT` using `crypto.subtle.importKey` on the base64url-decoded private key + `crypto.subtle.sign`.
- `encryptPushPayload(payload, p256dh, auth)` — aes128gcm per RFC 8291. Uses WebCrypto only (works on Cloudflare Workers — no Node-only deps, no `web-push` npm package).
- `fanOut(subs, payload)` — parallel `fetch` with TTL=60, urgency=normal headers.

Payload is JSON `{ title, body, url }` — the SW reads it in the `push` handler.

## 2. Service worker — extend `public/sw.js`

Add (keep existing cache logic intact):

```js
self.addEventListener("push", (event) => {
  let data = { title: "Sans Sucre", body: "", url: "/admin" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url },
    tag: "sanssucre-staff",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if (c.url.includes(url)) return c.focus();
    return self.clients.openWindow(url);
  })());
});
```

Bump `VERSION` to `v2` so old SWs upgrade.

## 3. Client hook — `src/hooks/use-staff-push.ts`

- Reads `getVapidPublicKey` via `useServerFn` + `useQuery` (cached).
- Exposes `{ permission, isSubscribed, isSupported, enable(), disable() }`.
- `enable()`: `Notification.requestPermission()` → `navigator.serviceWorker.ready` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })` → call `registerStaffPush`.
- `disable()`: unsubscribe locally + call `unregisterStaffPush`.
- Guards against SSR / unsupported browsers (iOS PWA-only check).

## 4. Admin UI — `src/routes/admin.index.tsx`

New "Notifications" card:
- Status pill: Off / Pending / On.
- **Enable notifications** button → `enable()`.
- **Disable** + **Send test notification** buttons (admin-only) once subscribed.
- iOS hint: "Add to Home Screen first" if `standalone === false` on iOS Safari.

Uses existing toast for success/error feedback.

## 5. Auto-fire on key events

- `src/server/signup.functions.ts → submitSignup`: after the row insert, fire-and-forget `sendStaffPush({ title: "New signup", body: \`${name} · ${reward}\`, url: "/admin" })` wrapped in try/catch so push failures never break signup.
- `src/server/redeem.functions.ts` (the server fn calling `redeem_signup`): same pattern with title "Code redeemed".

Both call the internal helper directly (not the protected serverFn) — extract `_fanOutStaffPush(payload)` from `push.functions.ts` into `push.server.ts` so unauth contexts can trigger it.

## 6. Verification

- Subscribe from `/admin` in preview (Chrome desktop).
- Click "Send test notification" → notification appears, click takes you to `/admin`.
- Submit a signup in another tab → admin tab gets push.
- Redeem a code → admin tab gets push.
- Check `staff_push_subscriptions` row created; force a 410 by manually deleting endpoint server-side and re-firing to confirm prune logic.

## Out of scope (deferred)

- Multi-device sync UI (list all your subscriptions, revoke individually).
- Per-event toggles (some staff want signups but not redeems).
- Quiet hours.
- iOS Safari install prompt UI polish.

## Order

1. Approve plan.
2. Write `push.server.ts` + `push.functions.ts` + extend SW.
3. Add hook + admin card.
4. Wire fan-out into signup + redeem.
5. Manually verify with test button + a real signup.
