"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

type ProfileData = {
  email: string;
  stellar_public_key: string | null;
  stellar_payout_public_key: string | null;
  org_payout_wallet_public_key: string | null;
  org_id: string | null;
  org_stellar_disbursement_public_key?: string | null;
  org_has_stored_secret?: boolean;
  allowed: boolean;
  admin_level: string;
  activation_requested_at: string | null;
  needsPayoutWalletSetup?: boolean;
};

const STELLAR_EXPERT_BASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

const FRIENDBOT_URL = "https://friendbot.stellar.org";

const REGISTRATION_MESSAGE_PREFIX = "SozuPay wallet registration";

export default function ProfilePage() {
  const { user: privyUser } = usePrivy();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingActivation, setRequestingActivation] = useState(false);
  const [activationRequested, setActivationRequested] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [createStep, setCreateStep] = useState<"idle" | "backup" | "registering">("idle");
  const [newKeypair, setNewKeypair] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [justCreatedOrgKeys, setJustCreatedOrgKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [revealedOrgSecret, setRevealedOrgSecret] = useState<string | null>(null);
  const [loadingOrgSecret, setLoadingOrgSecret] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setProfile(null);
          return;
        }
        setProfile(data);
        setActivationRequested(!!data.activation_requested_at);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const displayName =
    privyUser?.email?.address ??
    profile?.email?.split("@")[0] ??
    "User";
  const avatarUrl = (privyUser as { avatar?: string })?.avatar ?? null;

  const handleRequestActivation = async () => {
    setRequestingActivation(true);
    try {
      const res = await fetch("/api/profile/request-activation", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setActivationRequested(true);
        if (profile) setProfile({ ...profile, activation_requested_at: data.activation_requested_at ?? new Date().toISOString() });
      }
    } finally {
      setRequestingActivation(false);
    }
  };

  const handleCreateWallet = async () => {
    setCreateError(null);
    const { Keypair } = await import("@stellar/stellar-sdk");
    const keypair = Keypair.random();
    setNewKeypair({
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    });
    setCreateStep("backup");
    setBackupConfirmed(false);
  };

  const handleCreateOrganization = async () => {
    setCreateOrgError(null);
    setCreatingOrg(true);
    try {
      const res = await fetch("/api/profile/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My organization", type: "ngo" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateOrgError(data.error ?? "Failed to create organization");
        return;
      }
      if (data.publicKey && data.secretKey) {
        setJustCreatedOrgKeys({ publicKey: data.publicKey, secretKey: data.secretKey });
      } else {
        loadProfile();
      }
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleRevealOrgSecret = async () => {
    setLoadingOrgSecret(true);
    setRevealedOrgSecret(null);
    try {
      const res = await fetch("/api/profile/org/secret");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.secretKey) {
        setRevealedOrgSecret(data.secretKey);
      }
    } finally {
      setLoadingOrgSecret(false);
    }
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmBackupAndRegister = async () => {
    if (!newKeypair || !backupConfirmed) return;
    setCreateStep("registering");
    setCreateError(null);
    const message = `${REGISTRATION_MESSAGE_PREFIX} ${Date.now()}`;
    try {
      const { Keypair } = await import("@stellar/stellar-sdk");
      const keypair = Keypair.fromSecret(newKeypair.secretKey);
      const signature = keypair.sign(Buffer.from(message, "utf8"));
      const res = await fetch("/api/profile/wallet/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stellar_public_key: newKeypair.publicKey,
          message,
          signature: signature.toString("base64"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "Registration failed");
        setCreateStep("backup");
        return;
      }
      setNewKeypair(null);
      setCreateStep("idle");
      setBackupConfirmed(false);
      loadProfile();
      loadProfile();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Registration failed");
      setCreateStep("backup");
    }
  };

  const handleCancelCreate = () => {
    setCreateStep("idle");
    setNewKeypair(null);
    setBackupConfirmed(false);
    setCreateError(null);
  };

  if (loading) {
    return (
      <div className="text-gray-500 dark:text-gray-400">Loading profile…</div>
    );
  }

  if (!profile) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">Could not load profile.</p>
        <button type="button" onClick={() => loadProfile()} className="mt-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
          Retry
        </button>
        <Link href="/dashboard" className="mt-3 ml-2 inline-block text-sm text-gray-600 dark:text-gray-400 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stellarExplorerUrl = profile.stellar_public_key
    ? `${STELLAR_EXPERT_BASE}/account/${profile.stellar_public_key}`
    : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link
          href="/dashboard/settings"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Settings
        </Link>
      </div>

      {/* Profile card: picture, name, email */}
      <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-gray-600 dark:text-gray-400 overflow-hidden"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: "cover" } : undefined}
          >
            {!avatarUrl && displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
          </div>
        </div>
      </section>

      {/* Admin payout wallet (super-admin): only needed when org has no disbursement wallet. With org wallet, you approve in one click and the org signs. */}
      {profile.admin_level === "super_admin" && !profile.org_has_stored_secret && (
        <section className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-6">
          <h2 className="text-lg font-semibold">Admin payout wallet</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your organization has no disbursement wallet yet. Set up this wallet to sign payouts, or create an organization with a wallet above. Fund it with XLM and add a USDC trustline.
          </p>
          {(profile.stellar_payout_public_key || profile.stellar_public_key) ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-sm text-gray-800 dark:text-gray-200 break-all bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800">
                  {profile.stellar_payout_public_key ?? profile.stellar_public_key}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(profile.stellar_payout_public_key ?? profile.stellar_public_key!, "admin-payout")}
                  className="rounded-md border border-amber-300 dark:border-amber-700 px-2 py-1.5 text-xs font-medium shrink-0"
                >
                  {copied === "admin-payout" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fund this address with XLM, then add a USDC trustline. On testnet, use{" "}
                <a
                  href={`${FRIENDBOT_URL}/?addr=${encodeURIComponent(profile.stellar_payout_public_key ?? profile.stellar_public_key ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Friendbot
                </a>{" "}
                to get XLM, then add the USDC trustline (e.g. via Stellar Laboratory or your wallet).
              </p>
              <a
                href={`${STELLAR_EXPERT_BASE}/account/${profile.stellar_payout_public_key ?? profile.stellar_public_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on Stellar Expert →
              </a>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Set up a wallet so you can sign payouts. Choose one:
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/onboarding/set-payout-wallet"
                  className="rounded-md bg-amber-600 dark:bg-amber-500 text-white px-3 py-2 text-sm font-medium hover:opacity-90"
                >
                  Set passphrase (recommended)
                </Link>
                <button
                  type="button"
                  onClick={handleCreateWallet}
                  className="rounded-md border border-amber-300 dark:border-amber-700 px-3 py-2 text-sm font-medium hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                >
                  Create new keypair
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Passphrase: we derive a key (you never see the secret). Keypair: you back up the secret once and use it to unlock when paying.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Create organization (super_admin without org) */}
      {profile.admin_level === "super_admin" && !profile.org_id && !justCreatedOrgKeys && (
        <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
          <h2 className="text-lg font-semibold">Organization</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create an organization to associate payouts and (optionally) Soroban contracts. You can set the name and type (NGO / store) later.
          </p>
          {createOrgError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {createOrgError}
            </p>
          )}
          <button
            type="button"
            disabled={creatingOrg}
            onClick={handleCreateOrganization}
            className="mt-4 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {creatingOrg ? "Creating…" : "Create organization"}
          </button>
        </section>
      )}

      {/* Just-created org: backup secret (from Profile create-org flow) */}
      {justCreatedOrgKeys && (
        <section className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-6">
          <h2 className="text-lg font-semibold">Save your organization wallet key</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Store the secret key securely. Payouts are sent from this wallet. You can reveal it again from this page later.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 font-mono text-sm break-all bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800">
                {justCreatedOrgKeys.publicKey}
              </code>
              <button type="button" onClick={() => handleCopy(justCreatedOrgKeys.publicKey, "org-pub")} className="rounded-md border border-amber-300 dark:border-amber-700 px-2 py-1.5 text-xs shrink-0">
                {copied === "org-pub" ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 font-mono text-sm break-all bg-red-50 dark:bg-red-950/30 px-2 py-1.5 rounded text-red-800 dark:text-red-200">
                {justCreatedOrgKeys.secretKey}
              </code>
              <button type="button" onClick={() => handleCopy(justCreatedOrgKeys.secretKey, "org-secret")} className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1.5 text-xs shrink-0 text-red-700 dark:text-red-400">
                {copied === "org-secret" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setJustCreatedOrgKeys(null); loadProfile(); }}
            className="mt-4 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-sm font-medium"
          >
            I’ve saved the key — continue
          </button>
        </section>
      )}

      {/* Organization disbursement wallet (super_admin with org that has a wallet) */}
      {profile.admin_level === "super_admin" && profile.org_id && profile.org_stellar_disbursement_public_key && (
        <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
          <h2 className="text-lg font-semibold">Organization disbursement wallet</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Payouts are sent from this wallet. As a super admin you can reveal the secret key to back it up or use it elsewhere.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 font-mono text-sm break-all bg-gray-100 dark:bg-gray-700/50 px-2 py-1.5 rounded">
              {profile.org_stellar_disbursement_public_key}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(profile.org_stellar_disbursement_public_key!, "org-addr")}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs shrink-0"
            >
              {copied === "org-addr" ? "Copied" : "Copy"}
            </button>
          </div>
          {profile.org_has_stored_secret && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRevealOrgSecret}
                disabled={loadingOrgSecret}
                className="rounded-md border border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {loadingOrgSecret ? "Loading…" : "Reveal org wallet secret"}
              </button>
              {revealedOrgSecret && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="flex-1 min-w-0 font-mono text-sm break-all bg-red-50 dark:bg-red-950/30 px-2 py-1.5 rounded text-red-800 dark:text-red-200">
                    {revealedOrgSecret}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(revealedOrgSecret, "revealed-secret")}
                    className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1.5 text-xs text-red-700 dark:text-red-400 shrink-0"
                  >
                    {copied === "revealed-secret" ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevealedOrgSecret(null)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs shrink-0"
                  >
                    Hide
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Org payout wallet from env (optional; when set, Classic payouts can use this shared org key) */}
      {profile.org_payout_wallet_public_key && profile.admin_level === "super_admin" && (
        <section className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-6">
          <h2 className="text-lg font-semibold">Organization payout wallet</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            All Stellar payouts to recipients are sent from this wallet. You authorize each payout; the org wallet signs. Fund it with XLM and USDC (testnet or mainnet).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 font-mono text-sm text-gray-800 dark:text-gray-200 break-all bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800">
              {profile.org_payout_wallet_public_key}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(profile.org_payout_wallet_public_key!, "org")}
              className="rounded-md border border-amber-300 dark:border-amber-700 px-2 py-1.5 text-xs font-medium shrink-0"
            >
              {copied === "org" ? "Copied" : "Copy"}
            </button>
          </div>
          <a
            href={`${STELLAR_EXPERT_BASE}/account/${profile.org_payout_wallet_public_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View on Stellar Expert →
          </a>
        </section>
      )}

      {/* Smart wallet: one card with wallet UI + small activation button when not allowed */}
      <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
        <h2 className="text-lg font-semibold">Smart wallet</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your Stellar account for receiving and sending. You control the keys; we only store your public address.
        </p>

        {profile.stellar_public_key ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 font-mono text-sm text-gray-700 dark:text-gray-300 break-all bg-gray-100 dark:bg-gray-700/50 px-2 py-1.5 rounded">
                {profile.stellar_public_key}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(profile.stellar_public_key!, "address")}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs font-medium shrink-0"
              >
                {copied === "address" ? "Copied" : "Copy"}
              </button>
            </div>
            {stellarExplorerUrl && (
              <a
                href={stellarExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on Stellar Expert →
              </a>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              To connect a different wallet, go to Settings → Recovery & wallet.
            </p>
          </div>
        ) : (createStep === "backup" || createStep === "registering") && newKeypair ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Save your secret key somewhere safe. We never store it. You won’t see it again.
            </p>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Public address</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-sm break-all bg-gray-100 dark:bg-gray-700/50 px-2 py-1.5 rounded">
                  {newKeypair.publicKey}
                </code>
                <button type="button" onClick={() => handleCopy(newKeypair.publicKey, "pub")} className="rounded-md border px-2 py-1.5 text-xs shrink-0">
                  {copied === "pub" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Secret key (backup and never share)</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-sm break-all bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded">
                  {newKeypair.secretKey}
                </code>
                <button type="button" onClick={() => handleCopy(newKeypair.secretKey, "secret")} className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1.5 text-xs shrink-0 text-red-700 dark:text-red-400">
                  {copied === "secret" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={backupConfirmed}
                onChange={(e) => setBackupConfirmed(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm">I’ve saved my secret key and won’t lose it</span>
            </label>
            {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!backupConfirmed || createStep === "registering"}
                onClick={handleConfirmBackupAndRegister}
                className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {createStep === "registering" ? "Registering…" : "Register wallet"}
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={createStep === "registering"}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No wallet linked yet. Create one or connect an existing Stellar account.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateWallet}
                className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-sm font-medium hover:opacity-90"
              >
                Create new wallet
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Connect existing wallet
              </button>
              {!profile.allowed && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  {activationRequested ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400">Activation requested</span>
                  ) : (
                    <button
                      type="button"
                      disabled={requestingActivation}
                      onClick={handleRequestActivation}
                      className="rounded-md border border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-400 px-2 py-1.5 text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                    >
                      {requestingActivation ? "…" : "Request activation"}
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create: we generate a keypair in your browser; you back up the secret. Connect: you prove ownership by signing a message.
            </p>
          </div>
        )}
      </section>

      {/* Recovery methods (no 2FA toggle – Privy handles it) */}
      <section className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
        <h2 className="text-lg font-semibold">Recovery methods</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Login uses Privy (email + passkey). Configure wallet recovery in Settings.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="font-medium text-sm">Login (Privy)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email and passkey — 2FA is handled by Privy</p>
            </div>
          </li>
          <li className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="font-medium text-sm">Recovery phrase</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Back up your wallet secret (shown when you create a wallet)</p>
            </div>
            <Link href="/dashboard/settings#recovery" className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              Settings
            </Link>
          </li>
          <li className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="font-medium text-sm">Recovery email</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fallback for account recovery</p>
            </div>
            <Link href="/dashboard/settings#recovery" className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              Settings
            </Link>
          </li>
        </ul>
        <Link href="/dashboard/settings#recovery" className="mt-4 inline-block rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium">
          Open Settings to manage recovery
        </Link>
      </section>

      {profile.allowed && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Your profile is activated. You can use your Stellar wallet for payments.
        </p>
      )}
    </div>
  );
}
