"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";

const usePrivyAuth = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * If Privy is configured, opens the Privy modal. After login the home page
 * syncs session and redirects to onboarding/dashboard. Fallback link goes to home.
 */
export function HomeSignInButton() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { login: openLoginModal } = useLogin();

  useEffect(() => {
    if (usePrivyAuth && authenticated) {
      router.replace("/");
    }
  }, [authenticated, router]);

  if (!usePrivyAuth) {
    return (
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium"
      >
        Sign in
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLoginModal()}
      disabled={!ready}
      className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {ready ? "Sign in" : "Preparing…"}
    </button>
  );
}
