"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { login: openLoginModal } = useLogin();

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  // Sync Privy session to our backend and redirect to dashboard
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const ABORT_MS = 20_000;
    let cancelled = false;

    (async () => {
      setSyncing(true);
      setError("");
      try {
        const tokenPromise = getAccessToken();
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Token request timed out")), ABORT_MS)
        );
        const accessToken = await Promise.race([tokenPromise, timeoutPromise]);
        if (!accessToken || cancelled) return;

        const emailAddress =
          user.email?.address ??
          (user.linkedAccounts?.find((a: { type: string }) => a.type === "email") as { address?: string } | undefined)
            ?.address;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ABORT_MS);

        const res = await fetch("/api/auth/privy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email: emailAddress ?? "" }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (cancelled) return;

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error ?? "Failed to sign in");
          return;
        }
        router.replace(data.needsPayoutWalletSetup ? "/onboarding/set-payout-wallet" : "/dashboard");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error) {
          if (e.name === "AbortError") {
            setError("Request timed out. Check your connection and try again.");
          } else {
            setError(e.message || "Something went wrong");
          }
        } else {
          setError("Something went wrong");
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user, getAccessToken, router]);

  const usePrivyAuth = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (usePrivyAuth && authenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-900">
        {syncing && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </main>
    );
  }

  if (usePrivyAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => ready && openLoginModal()}
          disabled={!ready}
          className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-6 font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Log in
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID to use login.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-gray-200 dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
