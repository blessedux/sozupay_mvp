"use client";

import { useState } from "react";

export default function SendUsdcForm({ onSent }: { onSent?: () => void }) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        toStellar: true,
        destination: destination.trim(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.payout) {
          setDestination("");
          setAmount("");
          onSent?.();
        }
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
