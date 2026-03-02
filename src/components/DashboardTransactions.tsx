"use client";

import { useState, useEffect } from "react";

interface Tx {
  id: string;
  date: string;
  amount: string;
  type: string;
  source: string;
  status: string;
  stellarExpertUrl: string;
}

export default function DashboardTransactions() {
  const [list, setList] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=10")
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((d) => setList(d.transactions ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold">Recent transactions</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Organization wallet activity. Each row links to Stellar Expert for audit.
      </p>
      {loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800" />
          <div className="animate-pulse h-12 bg-gray-50 dark:bg-gray-800/50" />
          <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : list.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No transactions yet.
        </p>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => (
                <tr key={tx.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-3">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{tx.amount} USDC</td>
                  <td className="p-3 capitalize">{tx.type}</td>
                  <td className="p-3">{tx.source}</td>
                  <td className="p-3">
                    <a
                      href={tx.stellarExpertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Stellar Expert
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <a
        href="/dashboard/transactions"
        className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        View all transactions
      </a>
    </div>
  );
}
