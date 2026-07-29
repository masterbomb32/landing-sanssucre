import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSignups from "./tools/list-signups";
import lookupCode from "./tools/lookup-code";
import listTestimonials from "./tools/list-testimonials";
import signupSummary from "./tools/signup-summary";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sweet-rewards-launch",
  title: "Sweet Rewards Launch",
  version: "0.1.0",
  instructions:
    "Tools for the Sans Sucre reward launch app. Use `signup_summary` for campaign totals, `list_signups` to browse recent signups, `lookup_redemption_code` to check one guest's code, and `list_testimonials` to review guest stories. All tools act as the signed-in staff user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [signupSummary, listSignups, lookupCode, listTestimonials],
});
