"use client";

import { useState, useEffect } from "react";

interface Recipient {
  id: string;
  name: string;
  bankAccountId: string;
}

interface BankAccount {
  id: string;
  label: string;
  last4: string;
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/recipients").then((r) => (r.ok ? r.json() : { recipients: [] })),
      fetch("/api/bank-accounts").then((r) => (r.ok ? r.json() : { accounts: [] })),
    ])
      .then(([r, a]) => {
        setRecipients(r.recipients ?? []);
        setAccounts(a.accounts ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    fetch("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "Recipient",
        bankAccountId: bankAccountId || accounts[0]?.id,
        twoFactorVerified: true,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error && d.required) {
          alert("2FA required to add recipient. Enable 2FA in Settings.");
          return;
        }
        setShowAdd(false);
        setName("");
        setBankAccountId("");
        load();
      })
      .catch(() => {});
  }

  function handlePayout(recipient: Recipient) {
    const amount = prompt("Amount (USDC):");
    if (!amount) return;
    fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        bankAccountId: recipient.bankAccountId,
        recipientLabel: recipient.name,
        twoFactorVerified: false,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error && d.required) {
          alert("2FA required for this payout.");
          return;
        }
        window.location.href = "/dashboard/payouts";
      })
      .catch(() => {});
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Recipients</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Providers and employees. One-off or scheduled payouts from the same wallet.
      </p>

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={accounts.length === 0}
          className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium disabled:opacity-50"
        >
          Add recipient
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-6 max-w-md space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bank account</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} (…{a.last4})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            2FA required when adding or changing bank data.
          </p>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2">
              Add
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 className="mt-8 text-lg font-semibold">Recipients</h2>
      {loading ? (
        <div className="mt-4 animate-pulse h-24 rounded-lg border border-gray-200 dark:border-gray-700" />
      ) : recipients.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-gray-400">No recipients yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recipients.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <span className="font-medium">{r.name}</span>
              <button
                type="button"
                onClick={() => handlePayout(r)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm"
              >
                Pay now
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Payouts appear as &quot;Payout – [Recipient]&quot; in the transaction list with Stellar Expert link.
      </p>
    </div>
  );
}
