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

export default function TransactionsPage() {
  const [list, setList] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=50")
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((d) => setList(d.transactions ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Transactions</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Organization wallet activity. Date, amount, type, source, status. Each row links to Stellar Expert.
      </p>
      {loading ? (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800" />
          <div className="animate-pulse h-12 bg-gray-50 dark:bg-gray-800/50" />
          <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : list.length === 0 ? (
        <p className="mt-6 text-gray-500 dark:text-gray-400">No transactions yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Stellar Expert</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="p-3">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{tx.amount} USDC</td>
                  <td className="p-3 capitalize">{tx.type}</td>
                  <td className="p-3">{tx.source}</td>
                  <td className="p-3 capitalize">{tx.status}</td>
                  <td className="p-3">
                    <a
                      href={tx.stellarExpertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </a>
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
