/**
 * Bank accounts – in-memory. In production use DB. 2FA required to add/edit (enforced in API).
 */

export interface BankAccount {
  id: string;
  userId: string;
  label: string;
  last4: string;
  isDefault: boolean;
  createdAt: string;
}

const store: Map<string, BankAccount> = new Map();

function nextId(): string {
  return `bank-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createBankAccount(
  userId: string,
  label: string,
  last4: string,
  isDefault: boolean
): BankAccount {
  const id = nextId();
  const account: BankAccount = {
    id,
    userId,
    label,
    last4,
    isDefault,
    createdAt: new Date().toISOString(),
  };
  store.set(id, account);
  if (isDefault) {
    for (const a of store.values()) {
      if (a.userId === userId && a.id !== id) (a as BankAccount).isDefault = false;
    }
  }
  return account;
}

export function getBankAccount(id: string): BankAccount | undefined {
  return store.get(id);
}

export function listBankAccounts(userId: string): BankAccount[] {
  return Array.from(store.values()).filter((a) => a.userId === userId);
}

export function updateBankAccount(
  id: string,
  userId: string,
  updates: Partial<Pick<BankAccount, "label" | "last4" | "isDefault">>
): BankAccount | undefined {
  const a = store.get(id);
  if (!a || a.userId !== userId) return undefined;
  if (updates.label !== undefined) a.label = updates.label;
  if (updates.last4 !== undefined) a.last4 = updates.last4;
  if (updates.isDefault === true) {
    for (const x of store.values()) {
      if (x.userId === userId) (x as BankAccount).isDefault = x.id === id;
    }
  }
  return a;
}

export function deleteBankAccount(id: string, userId: string): boolean {
  const a = store.get(id);
  if (!a || a.userId !== userId) return false;
  store.delete(id);
  return true;
}
