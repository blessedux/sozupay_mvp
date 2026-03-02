"use client";

import { useState } from "react";

export type StellarPayoutBody = {
  amount: string;
  toStellar: true;
  destination: string;
  recipientLabel?: string;
};

export type PayoutSuccess = {
  amount: string;
  destination: string;
  recipientLabel?: string;
  stellarTxHash?: string;
};

export default function SendUsdcForm({
  onSent,
  onFailed,
  onRequireUnlock,
  onSubmitting,
}: {
  onSent?: (payout: PayoutSuccess) => void;
  onFailed?: (error: string) => void;
  onRequireUnlock?: (body: StellarPayoutBody) => void;
  /** When provided, form opens confirm flow (parent shows modal and submits on confirm). Receives summary and body so parent can submit later. */
  onSubmitting?: (summary: { amount: string; destination: string; recipientLabel?: string }, body: StellarPayoutBody) => void;
}) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: StellarPayoutBody = {
      amount,
      toStellar: true,
      destination: destination.trim(),
      recipientLabel: undefined,
    };
    const summary = { amount, destination: destination.trim(), recipientLabel: body.recipientLabel };
    if (onSubmitting) {
      onSubmitting(summary, body);
      return;
    }
    setLoading(true);
    fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const text = await r.text();
        let d: { payout?: { amount?: string; stellarTxHash?: string; stellarAddress?: string; recipientLabel?: string }; error?: string; requireUnlock?: boolean } = {};
        try {
          d = text ? JSON.parse(text) : {};
        } catch {
          d = { error: r.ok ? "Invalid response" : `${r.status} ${r.statusText}` };
        }
        if (!r.ok && !d.error) {
          d.error = r.status === 502 ? "Payout failed. Check terminal for details." : `Request failed (${r.status}).`;
        }
        return { ok: r.ok, data: d };
      })
      .then(({ ok, data: d }) => {
        if (d.requireUnlock && d.error && onRequireUnlock) {
          onRequireUnlock(body);
          return;
        }
        if (ok && d.payout) {
          const p = d.payout;
          setDestination("");
          setAmount("");
          onSent?.({
            amount: typeof p.amount === "string" ? p.amount : amount,
            destination: p.stellarAddress ?? destination.trim(),
            recipientLabel: p.recipientLabel,
            stellarTxHash: p.stellarTxHash,
          });
        } else if (d.error) {
          if (onFailed) onFailed(d.error);
          else alert(d.error);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Payout request failed.";
        if (onFailed) onFailed(msg);
        else alert(msg);
      })
      .finally(() => setLoading(false));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2 items-end max-w-md">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Stellar address</label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          className="mt-1 w-64 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mt-1 w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !destination.trim() || !amount}
        className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Send USDC
      </button>
    </form>
  );
}
