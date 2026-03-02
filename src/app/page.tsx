"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";

export default function HomePage() {
  const router = useRouter();
  const { ready, authenticated, user, getAccessToken, logout: privyLogout } = usePrivy();
  const { login: openLoginModal } = useLogin();

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(true);
  const clearedRef = useRef(false);

  // On home we clear session and Privy state so user must choose email each time
  useEffect(() => {
    if (!ready) return;
    if (clearedRef.current) return;
    clearedRef.current = true;
    (async () => {
      try {
        await fetch("/api/auth/clear-session", { credentials: "include" });
      } catch {
        // ignore
      }
      try {
        if (typeof privyLogout === "function") await privyLogout();
      } catch {
        // ignore
      }
      setClearing(false);
    })();
  }, [ready, privyLogout]);

  // Sync Privy session to backend and redirect to org picker (then dashboard)
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
          credentials: "include",
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
        router.replace("/onboarding/organizations");
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
  const isClearingSession = clearing && authenticated;

  if (usePrivyAuth && authenticated && !isClearingSession) {
    return (
      <DarkGradientBg>
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 dark text-white">
          <Image
            src="/sozucapital_logo.png"
            alt="Sozu Capital"
            width={120}
            height={120}
            className="mb-2 object-contain"
            priority
          />
          {syncing && (
            <p className="text-sm text-gray-300">Redirecting…</p>
          )}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </main>
      </DarkGradientBg>
    );
  }

  if (usePrivyAuth) {
    return (
      <DarkGradientBg>
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 dark text-white">
          <Image
            src="/sozucapital_logo.png"
            alt="Sozu Capital"
            width={120}
            height={120}
            className="mb-2 object-contain"
            priority
          />
          <p className="text-sm text-gray-400 text-center max-w-sm">
            One wallet, one source of truth.
          </p>
          <button
            type="button"
            onClick={() => ready && openLoginModal()}
            disabled={!ready}
            className="rounded-md bg-white text-gray-900 py-2.5 px-6 font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {ready ? "Log in" : "Preparing…"}
          </button>
        </main>
      </DarkGradientBg>
    );
  }

  return (
    <DarkGradientBg>
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 dark text-white">
        <Image
          src="/sozucapital_logo.png"
          alt="Sozu Capital"
          width={120}
          height={120}
          className="mb-2 object-contain"
          priority
        />
        <div className="w-full max-w-sm rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow-lg text-center">
          <p className="text-sm text-gray-300">
            Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID to use login.
          </p>
        </div>
      </main>
    </DarkGradientBg>
  );
}
