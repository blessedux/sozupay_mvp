"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FRIENDBOT_URL = "https://friendbot.stellar.org";

export default function SetPayoutWalletPage() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPublicKey, setSuccessPublicKey] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters.");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match.");
      return;
    }
    setSubmitting(true);
    fetch("/api/profile/wallet/set-passphrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passphrase,
        confirmPassphrase,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
        setSuccessPublicKey(d.publicKey ?? null);
      })
      .catch(() => {
        setError("Something went wrong.");
        setSubmitting(false);
      });
  }

  if (successPublicKey) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Admin payout wallet ready
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Fund this address with XLM and add a USDC trustline so you can send payouts to recipients.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 font-mono text-sm break-all bg-gray-100 dark:bg-gray-700 px-2 py-1.5 rounded">
                {successPublicKey}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(successPublicKey)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs font-medium shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              On testnet: use{" "}
              <a
                href={`${FRIENDBOT_URL}/?addr=${encodeURIComponent(successPublicKey)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Friendbot
              </a>{" "}
              to fund with XLM, then add the USDC trustline (e.g. via Stellar Laboratory or your wallet).
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.replace("/dashboard/profile")}
              className="w-full rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-4 font-medium"
            >
              Continue to Profile
            </button>
            <Link
              href="/dashboard"
              className="w-full text-center rounded-md border border-gray-300 dark:border-gray-600 py-2.5 px-4 text-sm font-medium"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Set your payout wallet passphrase
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This passphrase is used to derive the Stellar key that signs payouts when you are a super admin.
          Choose something strong and memorable. We never store the passphrase—only the derived public key.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Passphrase
            </label>
            <input
              id="passphrase"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="confirmPassphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm passphrase
            </label>
            <input
              id="confirmPassphrase"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Same as above"
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-4 font-medium disabled:opacity-50"
          >
            {submitting ? "Setting…" : "Set passphrase and continue"}
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          You will need this passphrase when you perform Stellar payouts as a super admin. Store it securely.
        </p>
      </div>
    </main>
  );
}
