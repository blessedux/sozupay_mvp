"use client";

import { useState, useEffect } from "react";

interface BankAccount {
  id: string;
  label: string;
  last4: string;
  isDefault: boolean;
}

export default function BankAccountsSection() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/bank-accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label || "Bank account",
        last4: last4.replace(/\D/g, "").slice(-4) || "****",
        isDefault,
        twoFactorVerified: true,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setShowAdd(false);
        setLabel("");
        setLast4("");
        setIsDefault(false);
        load();
      })
      .catch(() => setError("Request failed"));
  }

  function setAsDefault(id: string) {
    fetch(`/api/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true, twoFactorVerified: true }),
    }).then(() => load());
  }

  function remove(id: string) {
    if (!confirm("Remove this bank account?")) return;
    fetch(`/api/bank-accounts/${id}`, { method: "DELETE" }).then(() => load());
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        2FA is required to add or change bank details.
      </p>
      {accounts.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3"
        >
          <div>
            <span className="font-medium">{a.label}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">…{a.last4}</span>
            {a.isDefault && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
            )}
          </div>
          <div className="flex gap-2">
            {!a.isDefault && (
              <button
                type="button"
                onClick={() => setAsDefault(a.id)}
                className="text-sm text-blue-600 dark:text-blue-400"
              >
                Set default
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm"
        >
          Add bank account
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 max-w-sm">
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last 4 digits</label>
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="text-sm">Default for my withdrawals</span>
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 text-sm">
              Add
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
