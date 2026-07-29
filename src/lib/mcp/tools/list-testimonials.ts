import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_testimonials",
  title: "List testimonials",
  description: "List guest testimonials with their rating, quote and approval state.",
  inputSchema: {
    limit: z.number().int().describe("How many testimonials to return (1-100). Defaults to 20.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const { data, error } = await supabaseForUser(ctx)
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(take);
    if (error) return errorResult(error.message);
    return jsonResult({ count: data?.length ?? 0, testimonials: data ?? [] });
  },
});
