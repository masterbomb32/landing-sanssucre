The preview URL itself is reachable, but direct access redirects through Lovable’s auth bridge. Inside the sandbox preview, the app loads successfully through the `lovableproject.com` preview origin. The remaining “refused to connect” symptom is therefore most likely caused by iframe framing headers for the preview/auth-bridge path, not by the React app failing to render.

Plan:
1. Inspect all security-header configuration in the app for duplicated or conflicting CSP / `X-Frame-Options` headers.
2. If needed, adjust the app CSP to explicitly allow the Lovable editor origins that can embed the app, while keeping the rest of the policy locked down.
3. Restart/refresh the preview server after the header change so the latest middleware is active.
4. Verify with browser/network tools that:
   - the app route loads in the preview iframe,
   - no `X-Frame-Options` header blocks embedding,
   - `frame-ancestors` includes Lovable editor origins,
   - the page renders normally.

If those checks pass but your editor still shows “refused to connect,” the fix is outside project code: the editor session is trying to frame the auth-bridge/login route instead of the app preview. In that case the practical workaround is to use the in-editor preview/sandbox URL after logging in, not the `id-preview--...lovable.app` URL directly.