"use client";

import { useState, useEffect } from "react";

export default function VaultPage() {
  const [data, setData] = useState<{
    balanceInVault: string;
    apy: string;
    accruedYield: string;
    rateSource: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vault")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Vault / yield</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Organization wallet DeFi allocation: balance in vault, APY, accrued yield.
      </p>

      <div className="mt-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 max-w-xl">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          We earn 10% of your yield. You keep 90%. No lockup.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse h-32" />
      ) : data ? (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 max-w-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Balance in vault
            </h2>
            <p className="text-xl font-bold mt-1">{data.balanceInVault} USDC</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Current APY
            </h2>
            <p className="text-xl font-bold mt-1">{data.apy || "—"}%</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Accrued yield
            </h2>
            <p className="text-xl font-bold mt-1">{data.accruedYield} USDC</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {data.rateSource}
          </p>
        </div>
      ) : null}
    </div>
  );
}
