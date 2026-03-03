"use client";

import { useState, useEffect } from "react";

type PendingUser = {
  id: number;
  privy_user_id: string;
  email: string;
  stellar_public_key: string | null;
  stellar_smart_account_address?: string | null;
  allowed: boolean;
  activation_requested_at: string | null;
  activation_requested_org_id?: string | null;
  requested_org_name?: string | null;
};

const STELLAR_EXPERT_BASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

export default function AdminPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pending-activations")
      .then((r) => {
        if (r.status === 403) setForbidden(true);
        return r.json();
      })
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, []);

  const [lastResult, setLastResult] = useState<{ funded?: boolean; fund_tx_hash?: string; error?: string } | null>(null);

  const handleActivate = async (privyUserId: string) => {
    setActivatingId(privyUserId);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/activate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privy_user_id: privyUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.privy_user_id !== privyUserId));
        setLastResult({ funded: data.funded, fund_tx_hash: data.fund_tx_hash });
      } else {
        setLastResult({ error: data.error ?? data.details ?? "Activation failed" });
      }
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading…</div>;
  }

  if (forbidden) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 text-red-600 dark:text-red-400">You don’t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Activate user profiles and fund their wallet. Classic accounts (G...) are funded with XLM via createAccount; smart accounts (C...) are funded via XLM Payment. Requires STELLAR_FUNDER_SECRET.
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Network: <span className="font-medium capitalize">{process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public" ? "mainnet" : "testnet"}</span>
      </p>
      {lastResult && (
        <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
          {lastResult.error ? (
            <p className="text-red-600 dark:text-red-400">{lastResult.error}</p>
          ) : (
            <>
              {lastResult.funded && lastResult.fund_tx_hash ? (
                <p className="text-green-700 dark:text-green-400">
                  User allowed and account funded. Tx: {lastResult.fund_tx_hash.slice(0, 12)}…
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">User allowed. (No G address to fund or STELLAR_FUNDER_SECRET not set.)</p>
              )}
            </>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Pending activation requests</h2>
        {users.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No pending requests.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Requested: {u.activation_requested_at ? new Date(u.activation_requested_at).toLocaleString() : "—"}
                  </p>
                  {u.requested_org_name ? (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      Requested as org admin: {u.requested_org_name}
                    </p>
                  ) : u.activation_requested_org_id ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Requested (org id: {u.activation_requested_org_id})</p>
                  ) : null}
                  {(u.stellar_smart_account_address || u.stellar_public_key) && (
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1 break-all">
                      {u.stellar_smart_account_address ?? u.stellar_public_key}
                      {u.stellar_smart_account_address && (
                        <span className="text-gray-400 dark:text-gray-500 ml-1">(C)</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(u.stellar_smart_account_address || u.stellar_public_key) && (
                    <a
                      href={`${STELLAR_EXPERT_BASE}/account/${u.stellar_smart_account_address ?? u.stellar_public_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Stellar Expert
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={!!activatingId}
                    onClick={() => handleActivate(u.privy_user_id)}
                    className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {activatingId === u.privy_user_id ? "Activating…" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Activate sets the user as allowed and funds their wallet (XLM). If they requested in org context, they are assigned as org admin. G accounts get createAccount; C accounts get a Payment. After activation, G-account users can add the USDC trustline from Profile.
      </p>
    </div>
  );
}
