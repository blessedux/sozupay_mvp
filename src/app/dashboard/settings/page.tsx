"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BankAccountsSection from "@/components/BankAccountsSection";
import { usePrivy } from "@privy-io/react-auth";

export default function SettingsPage() {
  const [user, setUser] = useState<{ email: string; twoFactorEnabled?: boolean } | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const privy = usePrivy();
  const usePrivyAuth = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setTwoFactorEnabled(data.user?.twoFactorEnabled ?? false);
      })
      .catch(() => setUser(null));
  }, []);

  function handleToggle2FA() {
    if (!twoFactorEnabled) {
      setShowTotpSetup(true);
      return;
    }
    setTwoFactorEnabled(false);
    setShowTotpSetup(false);
  }

  function handleConfirmTotp(e: React.FormEvent) {
    e.preventDefault();
    setTwoFactorEnabled(true);
    setShowTotpSetup(false);
    setTotpCode("");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Link
          href="/dashboard/profile"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Profile
        </Link>
      </div>
      {user && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      )}

      <section className="mt-8" id="security">
        <h2 className="text-lg font-semibold">Security</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Two-factor authentication (TOTP): {twoFactorEnabled ? "On" : "Off"}
          </span>
          <button
            type="button"
            onClick={handleToggle2FA}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium"
          >
            {twoFactorEnabled ? "Disable" : "Enable"}
          </button>
        </div>
        {showTotpSetup && (
          <form onSubmit={handleConfirmTotp} className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 max-w-xs">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Enter the 6-digit code from your authenticator app to enable 2FA.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              aria-label="TOTP code"
            />
            <div className="mt-2 flex gap-2">
              <button type="submit" className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 text-sm">
                Confirm
              </button>
              <button
                type="button"
                onClick={() => { setShowTotpSetup(false); setTotpCode(""); }}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8" id="recovery">
        <h2 className="text-lg font-semibold">Recovery & wallet</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage recovery methods for your account and smart wallet. 2FA is in Security above; here you can back up your wallet recovery phrase or set a recovery email.
        </p>
        <div className="mt-4 space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <div>
            <p className="font-medium text-sm">Recovery phrase backup</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Export or back up your wallet secret phrase (shown only when you create a new wallet). Never share it.
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Available after you create a wallet in Profile.</p>
          </div>
          <div>
            <p className="font-medium text-sm">Recovery email</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Optional email used for account recovery. Your login email is already used for Privy recovery.
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Coming soon.</p>
          </div>
        </div>
      </section>

      <section className="mt-8" id="verification">
        <h2 className="text-lg font-semibold">Verification</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Optional: for off-ramp and higher limits, we may collect minimal business or bank details as required by our off-ramp partner. You can complete this when you first add a bank account.
        </p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Verification flow plug-in (per compliance requirements).</p>
      </section>

      <section className="mt-8" id="bank">
        <h2 className="text-lg font-semibold">Bank accounts</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add or edit bank accounts (2FA required). Default for your withdrawals; others for payouts to providers.
        </p>
        <BankAccountsSection />
      </section>

      <section className="mt-8" id="stores">
        <h2 className="text-lg font-semibold">Stores</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Connect Shopify, WooCommerce, or custom stores. Same wallet and transaction list.
        </p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">See docs/ecommerce-integration.md for widget and API.</p>
      </section>

      <div className="mt-8">
        {usePrivyAuth ? (
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                if (privy.logout) await privy.logout();
              } finally {
                const res = await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
                const url = res.headers.get("Location");
                window.location.href = url || "/login";
              }
            }}
            className="rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : (
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-3 py-1.5 text-sm"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
