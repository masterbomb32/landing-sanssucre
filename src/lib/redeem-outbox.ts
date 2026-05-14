import { get, set } from "idb-keyval";

export type OutboxItem = {
  id: string;
  code: string;
  redeemed_at: string;
  attempts: number;
};

const OUTBOX_KEY = "sanssucre.redeem.outbox.v1";

export async function listOutbox(): Promise<OutboxItem[]> {
  return (await get<OutboxItem[]>(OUTBOX_KEY)) ?? [];
}

export async function enqueue(code: string): Promise<OutboxItem> {
  const list = await listOutbox();
  const item: OutboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: code.toUpperCase(),
    redeemed_at: new Date().toISOString(),
    attempts: 0,
  };
  list.push(item);
  await set(OUTBOX_KEY, list);
  return item;
}

export async function replaceOutbox(items: OutboxItem[]) {
  await set(OUTBOX_KEY, items);
}

export async function outboxSize(): Promise<number> {
  return (await listOutbox()).length;
}