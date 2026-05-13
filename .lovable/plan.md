## Goal
Resolve the editor preview “refused to connect” caused by the app’s CSP `frame-ancestors` allowlist not matching the exact Lovable editor origin.

## Findings
- The browser console shows the app frame is blocked by CSP:
  - current policy includes `https://*.lovable.dev`
  - the actual parent origin is `https://lovable.dev`
- Wildcard subdomains do not match the apex domain, so `*.lovable.dev` does not allow `lovable.dev`.
- The app header is configured in `src/start.ts`.

## Implementation plan
1. Update `src/start.ts` CSP `frame-ancestors` to include both apex and wildcard Lovable editor domains:
   - `https://lovable.dev`
   - `https://*.lovable.dev`
   - `https://lovable.app`
   - `https://*.lovable.app`
   - `https://lovableproject.com`
   - `https://*.lovableproject.com`
   - `https://lovable.com`
   - `https://*.lovable.com`
2. Keep the rest of the security policy unchanged.
3. Verify the updated header no longer has the apex-domain gap.
4. Ask you to refresh/retry the editor preview after the dev server picks up the change.

## Technical note
This is a small app-side fix. It will not change Lovable’s own login/auth-bridge headers, but it addresses the CSP error shown in your screenshot where the app page itself blocks embedding by `https://lovable.dev`.