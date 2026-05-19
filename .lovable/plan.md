## Problem

`src/lib/push.functions.ts` is imported by client modules (`src/hooks/use-staff-push.ts`, `src/routes/admin.index.tsx`) to get RPC stubs for `getVapidPublicKey`, `registerStaffPush`, `unregisterStaffPush`, and `sendTestStaffPush`.

That file currently has a **top-level** `import { fanOutStaffPush } from "./push.server"`. `push.server.ts` imports `@/integrations/supabase/client.server` (service-role key). The TanStack import-protection plugin sees the server-only module reachable from a client bundle and aborts the production build at `src/lib/push.functions.ts:95:11`.

The previous fix (moving `notifyStaffSilently` into `push.server.ts`) didn't help because the static import of `push.server` from `push.functions.ts` is itself the leak.

## Fix

In `src/lib/push.functions.ts`, remove the top-level `import { fanOutStaffPush } from "./push.server"` and instead dynamically import it inside the `sendTestStaffPush` handler:

```ts
.handler(async ({ context }) => {
  await assertAdmin(context.userId);
  const { fanOutStaffPush } = await import("./push.server");
  return fanOutStaffPush({
    title: "Sans Sucre test 🍰",
    body: "Push notifications are working.",
    url: "/admin",
  });
})
```

Dynamic imports inside `.handler()` are only evaluated server-side, so the import-protection plugin no longer sees `client.server` reachable from the client bundle.

No other files need changes — `redeem.functions.ts` and `signup.functions.ts` already import from `@/lib/push.server` directly (server-only modules importing server-only modules is fine).

## Verification

After the change, the production build should complete without the `src/lib/push.functions.ts:95:11` import-protection error.
