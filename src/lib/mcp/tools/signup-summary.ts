import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "signup_summary",
  title: "Signup summary",
  description:
    "Summarise total signups, redeemed signups and reward popularity for the Sans Sucre launch campaign.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("signups")
      .select("reward_choice,redeemed_at")
      .limit(10000);
    if (error) return errorResult(error.message);
    const rows = data ?? [];
    const byReward: Record<string, number> = {};
    let redeemed = 0;
    for (const row of rows) {
      const key = (row.reward_choice as string) ?? "unknown";
      byReward[key] = (byReward[key] ?? 0) + 1;
      if (row.redeemed_at) redeemed++;
    }
    return jsonResult({
      total: rows.length,
      redeemed,
      unredeemed: rows.length - redeemed,
      byReward,
    });
  },
});
