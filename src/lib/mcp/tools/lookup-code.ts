import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "lookup_redemption_code",
  title: "Look up a redemption code",
  description:
    "Look up a single Sans Sucre signup by its redemption code and report its reward and redemption state.",
  inputSchema: {
    code: z.string().trim().describe("The 12-character redemption code shown on the guest's receipt."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ code }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("signups")
      .select("id,name,reward_choice,redemption_code,created_at,redeemed_at")
      .eq("redemption_code", code.toUpperCase())
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return jsonResult({ found: false, code: code.toUpperCase() });
    return jsonResult({ found: true, signup: data });
  },
});
