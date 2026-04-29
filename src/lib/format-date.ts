// Centralised date formatting in Asia/Manila (PHT, UTC+8).
// Database stores UTC; we format on display.
const TZ = "Asia/Manila";
const LOCALE = "en-PH";

type Style = "short" | "medium" | "long" | "full";

export function formatDateTime(
  input: string | number | Date | null | undefined,
  opts: { dateStyle?: Style; timeStyle?: Style } = { dateStyle: "medium", timeStyle: "short" },
): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(LOCALE, { ...opts, timeZone: TZ });
}

export function formatDate(
  input: string | number | Date | null | undefined,
  dateStyle: Style = "long",
): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(LOCALE, { dateStyle, timeZone: TZ });
}

export function formatTime(
  input: string | number | Date | null | undefined,
  timeStyle: Style = "short",
): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(LOCALE, { timeStyle, timeZone: TZ });
}

/** Returns the UTC ISO timestamp for the start of "today" in Manila (for daily counters). */
export function manilaStartOfTodayISO(): string {
  // Manila is UTC+8, no DST. Compute today's midnight in Manila as UTC.
  const now = new Date();
  // Shift to Manila wall time, zero out time, shift back.
  const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  manilaNow.setHours(0, 0, 0, 0);
  // Difference between the wall-time interpretation and real UTC = TZ offset.
  const tzOffsetMs = new Date(manilaNow.toLocaleString("en-US", { timeZone: "UTC" })).getTime() - manilaNow.getTime();
  return new Date(manilaNow.getTime() - tzOffsetMs).toISOString();
}
