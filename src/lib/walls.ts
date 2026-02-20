/**
 * Payment walls – in-memory store. In production use DB.
 */

export interface PaymentWall {
  id: string;
  name: string;
  defaultAmount: string;
  reference: string;
  createdAt: string;
  lastUsedAt: string | null;
  totalVolume: string;
  archived: boolean;
}

const store: Map<string, PaymentWall> = new Map();

function nextId(): string {
  return `wall-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createWall(
  name: string,
  defaultAmount: string = "0",
  reference: string = ""
): PaymentWall {
  const id = nextId();
  const wall: PaymentWall = {
    id,
    name,
    defaultAmount,
    reference,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    totalVolume: "0",
    archived: false,
  };
  store.set(id, wall);
  return wall;
}

export function getWall(id: string): PaymentWall | undefined {
  return store.get(id);
}

export function listWalls(includeArchived: boolean = false): PaymentWall[] {
  return Array.from(store.values()).filter(
    (w) => includeArchived || !w.archived
  );
}

export function updateWall(
  id: string,
  updates: Partial<Pick<PaymentWall, "name" | "defaultAmount" | "reference" | "archived">>
): PaymentWall | undefined {
  const w = store.get(id);
  if (!w) return undefined;
  if (updates.name !== undefined) w.name = updates.name;
  if (updates.defaultAmount !== undefined) w.defaultAmount = updates.defaultAmount;
  if (updates.reference !== undefined) w.reference = updates.reference;
  if (updates.archived !== undefined) w.archived = updates.archived;
  return w;
}

export function recordWallUsage(id: string, amount: string): void {
  const w = store.get(id);
  if (!w) return;
  w.lastUsedAt = new Date().toISOString();
  w.totalVolume = (parseFloat(w.totalVolume) + parseFloat(amount || "0")).toFixed(2);
}
