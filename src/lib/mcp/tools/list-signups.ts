import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_signups",
  title: "List signups",
  description:
    "List the most recent Sans Sucre reward signups, optionally filtered by redemption status.",
  inputSchema: {
    limit: z.number().int().describe("How many signups to return (1-100). Defaults to 20.").optional(),
    status: z
      .enum(["all", "redeemed", "unredeemed"])
      .describe("Filter by redemption status. Defaults to all.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    let query = supabaseForUser(ctx)
      .from("signups")
      .select("id,name,reward_choice,redemption_code,created_at,redeemed_at")
      .order("created_at", { ascending: false })
      .limit(take);
    if (status === "redeemed") query = query.not("redeemed_at", "is", null);
    if (status === "unredeemed") query = query.is("redeemed_at", null);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ count: data?.length ?? 0, signups: data ?? [] });
  },
});
