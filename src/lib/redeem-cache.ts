import { get, set, del } from "idb-keyval";

export type UnredeemedCode = {
  id: string;
  code: string;
  name: string;
  reward_choice: string;
  created_at: string;
};

const CODES_KEY = "sanssucre.redeem.codes.v1";
const CODES_AT_KEY = "sanssucre.redeem.codes.fetched_at.v1";
const LOCAL_REDEEMED_KEY = "sanssucre.redeem.locally_redeemed.v1";

export async function saveUnredeemed(rows: UnredeemedCode[]) {
  await set(CODES_KEY, rows);
  await set(CODES_AT_KEY, Date.now());
}

export async function loadUnredeemed(): Promise<UnredeemedCode[]> {
  return (await get<UnredeemedCode[]>(CODES_KEY)) ?? [];
}

export async function getCacheFetchedAt(): Promise<number | null> {
  return (await get<number>(CODES_AT_KEY)) ?? null;
}

export async function findLocalCode(code: string): Promise<UnredeemedCode | null> {
  const list = await loadUnredeemed();
  const upper = code.toUpperCase();
  return list.find((r) => r.code.toUpperCase() === upper) ?? null;
}

export async function markLocallyRedeemed(code: string) {
  const set_ = await get<string[]>(LOCAL_REDEEMED_KEY);
  const next = new Set(set_ ?? []);
  next.add(code.toUpperCase());
  await set(LOCAL_REDEEMED_KEY, Array.from(next));
}

export async function isLocallyRedeemed(code: string): Promise<boolean> {
  const set_ = await get<string[]>(LOCAL_REDEEMED_KEY);
  return (set_ ?? []).includes(code.toUpperCase());
}

export async function clearLocalRedemptions() {
  await del(LOCAL_REDEEMED_KEY);
}