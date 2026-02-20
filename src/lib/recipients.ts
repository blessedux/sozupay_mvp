/**
 * Recipients (providers/employees) – in-memory. 2FA when adding/changing bank.
 */

export interface Recipient {
  id: string;
  userId: string;
  name: string;
  bankAccountId: string;
  createdAt: string;
}

const store: Map<string, Recipient> = new Map();

function nextId(): string {
  return `recipient-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createRecipient(
  userId: string,
  name: string,
  bankAccountId: string
): Recipient {
  const id = nextId();
  const recipient: Recipient = {
    id,
    userId,
    name,
    bankAccountId,
    createdAt: new Date().toISOString(),
  };
  store.set(id, recipient);
  return recipient;
}

export function getRecipient(id: string): Recipient | undefined {
  return store.get(id);
}

export function listRecipients(userId: string): Recipient[] {
  return Array.from(store.values()).filter((r) => r.userId === userId);
}

export function updateRecipient(
  id: string,
  userId: string,
  updates: Partial<Pick<Recipient, "name" | "bankAccountId">>
): Recipient | undefined {
  const r = store.get(id);
  if (!r || r.userId !== userId) return undefined;
  if (updates.name !== undefined) r.name = updates.name;
  if (updates.bankAccountId !== undefined) r.bankAccountId = updates.bankAccountId;
  return r;
}

export function deleteRecipient(id: string, userId: string): boolean {
  const r = store.get(id);
  if (!r || r.userId !== userId) return false;
  store.delete(id);
  return true;
}
