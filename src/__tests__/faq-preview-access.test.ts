import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;

// Anon client = exactly what a non-admin visitor (or an attacker
// hand-crafting a query in DevTools) can do against PostgREST.
const anon = createClient(SUPABASE_URL!, SUPABASE_ANON!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

describe("FAQ preview access lockdown", () => {
  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      throw new Error(
        "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in env.",
      );
    }
  });

  it("anon CANNOT read draft_question column", async () => {
    const { data, error } = await anon
      .from("faqs")
      .select("draft_question")
      .limit(1);
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    // PostgREST surfaces a 42501 / permission denied for revoked column SELECT.
    expect(
      (error?.code ?? "") + " " + (error?.message ?? ""),
    ).toMatch(/permission denied|42501/i);
  });

  it("anon CANNOT read draft_answer column", async () => {
    const { error } = await anon
      .from("faqs")
      .select("draft_answer")
      .limit(1);
    expect(error).not.toBeNull();
    expect(
      (error?.code ?? "") + " " + (error?.message ?? ""),
    ).toMatch(/permission denied|42501/i);
  });

  it("anon CANNOT read has_draft column", async () => {
    const { error } = await anon
      .from("faqs")
      .select("has_draft")
      .limit(1);
    expect(error).not.toBeNull();
    expect(
      (error?.code ?? "") + " " + (error?.message ?? ""),
    ).toMatch(/permission denied|42501/i);
  });

  it("anon CANNOT read draft columns via wildcard select", async () => {
    // Belt-and-braces: even a `select(*)`-style request can't surface drafts.
    const { error } = await anon
      .from("faqs")
      .select("id,draft_question,draft_answer,has_draft")
      .limit(1);
    expect(error).not.toBeNull();
    expect(
      (error?.code ?? "") + " " + (error?.message ?? ""),
    ).toMatch(/permission denied|42501/i);
  });
});