"use client";

import { useState, useEffect } from "react";
import SendUsdcForm from "@/components/SendUsdcForm";

interface Payout {
  id: string;
  amount: string;
  type: string;
  recipientLabel?: string;
  stellarTxHash?: string;
  status: string;
  createdAt: string;
}

const STELLAR_EXPERT_BASE =
  process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; label: string; last4: string; isDefault: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/payouts")
      .then((r) => (r.ok ? r.json() : { payouts: [] }))
      .then((d) => setPayouts(d.payouts ?? []))
      .finally(() => setLoading(false));
    fetch("/api/bank-accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        bankAccountId: bankAccountId || (accounts[0]?.id),
        twoFactorVerified: false,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error && d.required) {
          alert("2FA required for this payout. Enable 2FA in Settings and try again.");
          return;
        }
        setShowForm(false);
        setAmount("");
        fetch("/api/payouts")
          .then((r) => r.json())
          .then((x) => setPayouts(x.payouts ?? []));
      })
      .catch(() => {});
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Withdraw to your bank or to providers/employees. 2FA required for large payouts.
      </p>

      {accounts.length === 0 && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          Add a bank account in Settings first (2FA required).
        </p>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={accounts.length === 0}
          className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium disabled:opacity-50"
        >
          New payout
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <label className="block text-sm font-medium">Amount (USDC)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
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
                  {a.label} (…{a.last4}) {a.isDefault ? "— Default" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2">
              Submit
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Send USDC (Stellar)</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Optional: send USDC to another Stellar address.
        </p>
        <SendUsdcForm onSent={() => fetch("/api/payouts").then((r) => r.json()).then((x) => setPayouts(x.payouts ?? []))} />
      </section>

      <h2 className="mt-8 text-lg font-semibold">Payout history</h2>
      {loading ? (
        <div className="mt-4 animate-pulse h-24 rounded-lg border border-gray-200 dark:border-gray-700" />
      ) : payouts.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-gray-400">No payouts yet.</p>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Stellar Expert</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="p-3">{p.amount} USDC</td>
                  <td className="p-3">Payout{p.recipientLabel ? ` – ${p.recipientLabel}` : ""}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3">
                    {p.stellarTxHash ? (
                      <a
                        href={`${STELLAR_EXPERT_BASE}/tx/${p.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
