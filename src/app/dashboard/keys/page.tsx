"use client";

import { useState, useEffect } from "react";

export default function KeysPage() {
  const [wallet, setWallet] = useState<{ publicKey: string; network: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then(setWallet)
      .finally(() => setLoading(false));
  }, []);

  function handleSendRecovery() {
    fetch("/api/auth/recovery/send", { method: "POST" })
      .then((r) => r.json())
      .then(() => setRecoverySent(true))
      .catch(() => {});
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Keys & custody</h1>

      <div className="mt-6 max-w-xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
        <p className="text-gray-700 dark:text-gray-300">
          You have full custody; we don&apos;t hold your funds. Your keys are derived and stored
          according to your recovery method. We never custody principal.
        </p>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : wallet ? (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Stellar public key (for audit)
            </h2>
            <p className="mt-1 font-mono text-sm break-all text-gray-600 dark:text-gray-400">
              {wallet.publicKey}
            </p>
            <p className="mt-1 text-xs text-gray-500">Network: {wallet.network}</p>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recovery</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Simple path: request a recovery link to your email to restore access.
        </p>
        <button
          type="button"
          onClick={handleSendRecovery}
          className="mt-3 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium"
        >
          {recoverySent ? "Recovery link sent" : "Send recovery link to my email"}
        </button>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          Advanced: recovery phrase or hardware key — available in Settings for power users.
        </p>
      </section>
    </div>
  );
}
