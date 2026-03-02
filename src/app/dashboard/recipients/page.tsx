"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PayoutStatusModal, { type PayoutModalSuccess } from "@/components/PayoutStatusModal";

const STELLAR_EXPERT_BASE =
  process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

interface Recipient {
  id: string;
  name: string;
  bankAccountId: string;
  stellarAddress?: string;
  phone?: string;
  createdAt?: string;
}

interface BankAccount {
  id: string;
  label: string;
  last4: string;
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [stellarAddress, setStellarAddress] = useState("");
  const [showPayMultiple, setShowPayMultiple] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amountPerRecipient, setAmountPerRecipient] = useState<Record<string, string>>({});
  const [batchAmount, setBatchAmount] = useState("");
  const [payMultipleSubmitting, setPayMultipleSubmitting] = useState(false);
  const [adminLevel, setAdminLevel] = useState<string>("");
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState("");
  const [unlockSecretKey, setUnlockSecretKey] = useState("");
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [pendingPayoutBody, setPendingPayoutBody] = useState<Record<string, unknown> | null>(null);
  const [payoutWalletAddress, setPayoutWalletAddress] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<{ amount: string; stellarTxHash?: string; recipientLabel?: string } | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutModalStatus, setPayoutModalStatus] = useState<"confirm" | "submitting" | "success" | "failed">("confirm");
  const [payoutModalSummary, setPayoutModalSummary] = useState<{ amount: string; destination?: string; recipientLabel?: string } | null>(null);
  const [payoutModalSuccess, setPayoutModalSuccess] = useState<PayoutModalSuccess | null>(null);
  const [payoutModalError, setPayoutModalError] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [payoutModalBatchCount, setPayoutModalBatchCount] = useState<number | null>(null);
  const [pendingConfirmBody, setPendingConfirmBody] = useState<Record<string, unknown> | null>(null);
  const [pendingBatchBody, setPendingBatchBody] = useState<Record<string, unknown> | null>(null);
  const [pendingRecipient, setPendingRecipient] = useState<Recipient | null>(null);

  function copyStellarToClipboard(recipientId: string, address: string) {
    navigator.clipboard.writeText(address).then(
      () => {
        setCopiedId(recipientId);
        setTimeout(() => setCopiedId(null), 2000);
      },
      () => alert("Failed to copy")
    );
  }

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/recipients").then((r) => (r.ok ? r.json() : { recipients: [] })),
      fetch("/api/bank-accounts").then((r) => (r.ok ? r.json() : { accounts: [] })),
    ])
      .then(([r, a]) => {
        setRecipients(r.recipients ?? []);
        setAccounts(a.accounts ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: { admin_level?: string; org_payout_wallet_public_key?: string | null; org_stellar_disbursement_public_key?: string | null; email?: string }) => {
        setAdminLevel(p.admin_level ?? "");
        setPayoutWalletAddress(p.org_payout_wallet_public_key ?? p.org_stellar_disbursement_public_key ?? null);
        setUserDisplayName(p.email?.split("@")[0] ?? "You");
      });
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const bank = bankAccountId || (accounts[0]?.id ?? "");
    const stellar = stellarAddress.trim() || undefined;
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!bank && !stellar) {
      alert("Add a bank account in Settings, or enter a Stellar address for this recipient.");
      return;
    }
    fetch("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        bankAccountId: bank || undefined,
        stellarAddress: stellar,
        phone: phone.trim() || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          alert(d.error);
          return;
        }
        setShowAdd(false);
        setName("");
        setBankAccountId("");
        setStellarAddress("");
        setPhone("");
        load();
      })
      .catch(() => alert("Failed to add recipient."));
  }

  function submitPayoutBody(body: Record<string, unknown>) {
    return fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      let data: Record<string, unknown> = {};
      try {
        const text = await r.text();
        if (text) data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = { error: r.statusText || "Request failed" };
      }
      return { ok: r.ok, status: r.status, data };
    });
  }

  function handlePayout(recipient: Recipient) {
    const amount = prompt("Amount (USDC):");
    if (!amount) return;
    const isStellar = !!recipient.stellarAddress && !recipient.bankAccountId;
    const body = isStellar
      ? { amount, toStellar: true, destination: recipient.stellarAddress, recipientLabel: recipient.name }
      : { amount, bankAccountId: recipient.bankAccountId, recipientLabel: recipient.name };
    setPayoutModalSummary({
      amount,
      destination: recipient.stellarAddress,
      recipientLabel: recipient.name,
    });
    setPayoutModalSuccess(null);
    setPayoutModalError(null);
    setPayoutModalBatchCount(null);
    setPendingConfirmBody(body);
    setPendingBatchBody(null);
    setPendingRecipient(recipient);
    setPayoutModalStatus("confirm");
    setPayoutModalOpen(true);
  }

  function handleConfirmDisbursement() {
    if (pendingBatchBody) {
      setPayoutModalStatus("submitting");
      setPayMultipleSubmitting(true);
      const body = pendingBatchBody;
      const count = (body.payouts as unknown[])?.length ?? 0;
      setPendingBatchBody(null);
      setPendingRecipient(null);
      submitPayoutBody(body)
        .then(({ ok, data }) => {
          if (data.requireUnlock && data.error) {
            setPayoutModalOpen(false);
            setPayoutModalBatchCount(null);
            setPendingPayoutBody(body);
            setShowUnlockModal(true);
            return;
          }
          if (!ok) {
            const msg = [data?.error, data.required ? "2FA may be required for large payouts." : null]
              .filter(Boolean)
              .join(" ") || "Request failed.";
            setPayoutModalStatus("failed");
            setPayoutModalError(msg);
            return;
          }
          setPayoutModalStatus("success");
          setPayoutModalSuccess({ amount: "", batchCount: count });
          setShowPayMultiple(false);
          setSelectedIds(new Set());
          setAmountPerRecipient({});
          setBatchAmount("");
        })
        .catch((err) => {
          setPayoutModalStatus("failed");
          setPayoutModalError(err instanceof Error ? err.message : "Batch payout request failed.");
        })
        .finally(() => setPayMultipleSubmitting(false));
      return;
    }
    if (pendingConfirmBody && pendingRecipient) {
      setPayoutModalStatus("submitting");
      const body = pendingConfirmBody;
      const recipient = pendingRecipient;
      setPendingConfirmBody(null);
      setPendingRecipient(null);
      submitPayoutBody(body)
        .then(({ ok, data }) => {
          if (data.requireUnlock && data.error) {
            setPayoutModalOpen(false);
            setPendingPayoutBody(body);
            setShowUnlockModal(true);
            return;
          }
          if (!ok) {
            const msg = [data?.error, data.required ? "2FA may be required for large payouts." : null]
              .filter(Boolean)
              .join(" ") || "Payout request failed.";
            setPayoutModalStatus("failed");
            setPayoutModalError(msg);
            return;
          }
          const p = data?.payout as { amount?: string; stellarTxHash?: string; recipientLabel?: string; stellarAddress?: string } | undefined;
          const successPayload = {
            amount: p?.amount ?? (body.amount as string),
            stellarTxHash: p?.stellarTxHash,
            recipientLabel: p?.recipientLabel ?? recipient.name,
            destination: p?.stellarAddress ?? recipient.stellarAddress,
          };
          setPayoutModalStatus("success");
          setPayoutModalSuccess(successPayload);
          setPayoutSuccess(successPayload);
        })
        .catch((err) => {
          setPayoutModalStatus("failed");
          setPayoutModalError(err instanceof Error ? err.message : "Payout request failed.");
        });
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    fetch(`/api/recipients/${id}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { alert(d?.error ?? "Failed to delete"); });
        setExpandedId((current) => (current === id ? null : current));
        load();
      })
      .catch(() => alert("Failed to delete recipient."))
      .finally(() => setDeletingId(null));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePayMultiple(e: React.FormEvent) {
    e.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      alert("Select at least one recipient.");
      return;
    }
    const useSameAmount = batchAmount.trim() !== "";
    const payouts: { recipientId: string; amount: string }[] = [];
    for (const rid of ids) {
      const amount = useSameAmount ? batchAmount.trim() : (amountPerRecipient[rid] ?? "").trim();
      if (!amount || parseFloat(amount) <= 0) {
        alert(`Enter a valid amount for ${recipients.find((r) => r.id === rid)?.name ?? rid}.`);
        return;
      }
      payouts.push({ recipientId: rid, amount });
    }
    const body = { payouts };
    setPayoutModalSummary(null);
    setPayoutModalSuccess(null);
    setPayoutModalError(null);
    setPayoutModalBatchCount(payouts.length);
    setPendingBatchBody(body);
    setPendingConfirmBody(null);
    setPendingRecipient(null);
    setPayoutModalStatus("confirm");
    setPayoutModalOpen(true);
  }

  function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    const passphrase = unlockPassphrase.trim();
    const secretKey = unlockSecretKey.trim();
    if ((!passphrase && !secretKey) || !pendingPayoutBody) return;
    setUnlockSubmitting(true);
    const body = secretKey
      ? { secretKey }
      : { passphrase };
    fetch("/api/auth/unlock-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          alert(d.error);
          setUnlockSubmitting(false);
          return;
        }
        return submitPayoutBody(pendingPayoutBody);
      })
      .then((result) => {
        if (!result) return;
        setShowUnlockModal(false);
        setUnlockPassphrase("");
        setUnlockSecretKey("");
        if (result.ok) {
          const count = (pendingPayoutBody as { payouts?: unknown[] })?.payouts?.length ?? 0;
          setPayoutModalStatus("success");
          setPayoutModalSuccess({ amount: "", batchCount: count });
          setPayoutModalOpen(true);
          setPendingPayoutBody(null);
          setShowPayMultiple(false);
          setSelectedIds(new Set());
          setAmountPerRecipient({});
          setBatchAmount("");
        } else {
          setPayoutModalOpen(true);
          setPayoutModalStatus("failed");
          setPayoutModalError((result.data?.error as string) ?? "Payout failed.");
          setPendingPayoutBody(null);
        }
      })
      .catch((err) => alert(err instanceof Error ? err.message : "Unlock or payout failed."))
      .finally(() => setUnlockSubmitting(false));
  }

  return (
    <div>
      <PayoutStatusModal
        open={payoutModalOpen}
        onClose={() => {
          setPayoutModalOpen(false);
          setPayoutModalSummary(null);
          setPayoutModalSuccess(null);
          setPayoutModalError(null);
          setPayoutModalBatchCount(null);
          setPendingConfirmBody(null);
          setPendingBatchBody(null);
          setPendingRecipient(null);
        }}
        status={payoutModalStatus}
        userName={userDisplayName}
        payoutSummary={payoutModalSummary ?? undefined}
        successData={payoutModalSuccess}
        errorMessage={payoutModalError}
        batchCount={payoutModalBatchCount ?? undefined}
        onConfirm={payoutModalStatus === "confirm" ? handleConfirmDisbursement : undefined}
      />

      <h1 className="text-2xl font-bold">Recipients</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Providers and employees. One-off or scheduled payouts from the same wallet.
      </p>

      {payoutSuccess && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-start justify-between gap-4"
        >
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">Payout sent successfully</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              {payoutSuccess.amount} USDC sent {payoutSuccess.recipientLabel ? `to ${payoutSuccess.recipientLabel}` : ""}
            </p>
            {payoutSuccess.stellarTxHash ? (
              <a
                href={`${STELLAR_EXPERT_BASE}/tx/${payoutSuccess.stellarTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
              >
                View on Stellar Expert →
              </a>
            ) : null}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/dashboard/payouts"
              className="rounded-md bg-green-700 dark:bg-green-600 text-white px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              Payout history
            </Link>
            <button
              type="button"
              onClick={() => setPayoutSuccess(null)}
              className="rounded p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/40"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium"
        >
          Add recipient
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-6 max-w-md space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipient name"
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="recipient-bank-account" className="block text-sm font-medium">Bank account (optional)</label>
            <select
              id="recipient-bank-account"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
            >
              <option value="">No bank – Stellar only</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} (…{a.last4})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Stellar address (optional)</label>
            <input
              value={stellarAddress}
              onChange={(e) => setStellarAddress(e.target.value)}
              placeholder="G..."
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide at least one: bank account or Stellar address.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2">
              Add
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 className="mt-8 text-lg font-semibold">Recipients</h2>
      {loading ? (
        <div className="mt-4 animate-pulse h-24 rounded-lg border border-gray-200 dark:border-gray-700" />
      ) : recipients.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-gray-400">No recipients yet.</p>
      ) : (
        <>
          {!showPayMultiple ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPayMultiple(true)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium"
              >
                Pay multiple
              </button>
            </div>
          ) : (
            <form onSubmit={handlePayMultiple} className="mt-4 max-w-2xl rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h3 className="font-medium">Select recipients and amounts (USDC)</h3>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Same amount for all (optional)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 10"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(e.target.value)}
                  className="w-full max-w-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave empty to set amount per recipient.</p>
              </div>
              <ul className="space-y-2">
                {recipients.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelected(r.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">{r.name}</span>
                      {(r.stellarAddress || !r.bankAccountId) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {r.stellarAddress ? "Stellar" : "No bank"}
                        </span>
                      )}
                    </label>
                    {selectedIds.has(r.id) && batchAmount.trim() === "" && (
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={amountPerRecipient[r.id] ?? ""}
                        onChange={(e) => setAmountPerRecipient((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                      />
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={payMultipleSubmitting || selectedIds.size === 0}
                  className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium disabled:opacity-50"
                >
                  {payMultipleSubmitting ? "Sending…" : "Pay selected"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayMultiple(false);
                    setSelectedIds(new Set());
                    setAmountPerRecipient({});
                    setBatchAmount("");
                  }}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <ul className="mt-4 space-y-2">
            {recipients.map((r) => {
              const isExpanded = expandedId === r.id;
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-[height]"
                >
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 min-h-[3.5rem]">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 rounded focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      <span
                        className={`inline-flex w-5 h-5 flex-shrink-0 items-center justify-center text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      >
                        ›
                      </span>
                      <span className="font-medium truncate">{r.name}</span>
                      {(r.stellarAddress || !r.bankAccountId) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                          {r.stellarAddress ? "Stellar" : "No bank"}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayout(r)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                    >
                      Pay now
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {r.stellarAddress && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-gray-500 dark:text-gray-500 shrink-0">Stellar</span>
                            <button
                              type="button"
                              onClick={() => copyStellarToClipboard(r.id, r.stellarAddress!)}
                              className="text-xs font-mono truncate max-w-[12rem] sm:max-w-xs text-left hover:underline focus:ring-2 focus:ring-offset-1 rounded cursor-pointer"
                              title="Click to copy"
                            >
                              {r.stellarAddress}
                            </button>
                            {copiedId === r.id && (
                              <span className="text-xs text-green-600 dark:text-green-400 shrink-0">Copied!</span>
                            )}
                          </div>
                        )}
                        {(r.phone ?? "").trim() && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-500 shrink-0">Phone</span>
                            <span>{r.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-500 dark:text-gray-500 shrink-0">Bank</span>
                          <span>{r.bankAccountId ? "Linked" : "—"}</span>
                        </div>
                        {r.createdAt && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-500 dark:text-gray-500 shrink-0">Added</span>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${r.name}?`)) handleDelete(r.id);
                            }}
                            disabled={deletingId === r.id}
                            className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-1.5 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
                          >
                            {deletingId === r.id ? "Removing…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Payouts appear as &quot;Payout – [Recipient]&quot; in the transaction list with Stellar Expert link.
      </p>
      {adminLevel === "super_admin" && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Stellar payouts are sent from your organization&apos;s wallet (see Profile). Fund the org wallet with XLM and USDC; you authorize each payout as super-admin.
        </p>
      )}

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg">
            <h2 id="unlock-title" className="text-lg font-semibold">Unlock wallet to sign payout</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Payouts are signed with the wallet shown on Profile. Use that wallet&apos;s passphrase (if you set one) or paste its secret key.
            </p>
            {payoutWalletAddress && (
              <p className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                Payout wallet: {payoutWalletAddress}
              </p>
            )}
            <form onSubmit={handleUnlockSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="unlock-passphrase" className="block text-sm font-medium">Passphrase (if you set one)</label>
                <input
                  id="unlock-passphrase"
                  type="password"
                  autoComplete="current-password"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  placeholder="Passphrase"
                  className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              <div className="relative">
                <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
              </div>
              <div>
                <label htmlFor="unlock-secret" className="block text-sm font-medium">Wallet secret key</label>
                <input
                  id="unlock-secret"
                  type="password"
                  autoComplete="off"
                  value={unlockSecretKey}
                  onChange={(e) => setUnlockSecretKey(e.target.value)}
                  placeholder="S..."
                  className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={unlockSubmitting || (!unlockPassphrase.trim() && !unlockSecretKey.trim())}
                  className="rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium disabled:opacity-50"
                >
                  {unlockSubmitting ? "Unlocking…" : "Unlock and pay"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setPendingPayoutBody(null);
                    setUnlockPassphrase("");
                    setUnlockSecretKey("");
                  }}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
