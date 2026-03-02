"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "choose" | "backup" | "done";
type OrgType = "store" | "ngo";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [, setType] = useState<OrgType | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [orgKeys, setOrgKeys] = useState<{
    publicKey: string;
    secretKey: string;
    orgName: string;
  } | null>(null);

  function handleChoose(orgType: OrgType) {
    setError("");
    setType(orgType);
    setCreating(true);
    fetch("/api/profile/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: orgType,
        name: orgType === "store" ? "My store" : "My NGO",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setCreating(false);
        if (d.error) {
          setError(d.error);
          return;
        }
        setOrgKeys({
          publicKey: d.publicKey,
          secretKey: d.secretKey,
          orgName: d.organization?.name ?? "My organization",
        });
        setStep("backup");
      })
      .catch(() => {
        setError("Something went wrong.");
        setCreating(false);
      });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function handleContinue() {
    if (!backupConfirmed) return;
    setStep("done");
    router.replace("/onboarding/organizations");
  }

  if (step === "done") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Organization created
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You can now choose this organization to manage and go to the dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/onboarding/organizations"
              className="w-full text-center rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-4 font-medium"
            >
              Choose organization & continue
            </Link>
            <Link
              href="/dashboard/profile"
              className="w-full text-center rounded-md border border-gray-300 dark:border-gray-600 py-2.5 px-4 text-sm font-medium"
            >
              Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (step === "backup" && orgKeys) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Save your organization wallet key
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This is the only time you will see the secret key. Store it securely. Payouts will be sent from this wallet. As a super admin you can always reveal it again from Profile.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Public key (disbursement address)</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-sm break-all bg-gray-100 dark:bg-gray-700 px-2 py-1.5 rounded">
                  {orgKeys.publicKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(orgKeys.publicKey)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs font-medium shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Secret key (keep private)</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-sm break-all bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1.5 rounded text-red-800 dark:text-red-200">
                  {orgKeys.secretKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(orgKeys.secretKey)}
                  className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1.5 text-xs font-medium shrink-0 text-red-700 dark:text-red-400"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={backupConfirmed}
              onChange={(e) => setBackupConfirmed(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I have saved the secret key securely
            </span>
          </label>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!backupConfirmed}
              className="w-full rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Create your organization
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choose the type of organization. We will create a Stellar wallet for disbursements; you will back up the secret key on the next screen.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleChoose("store")}
            disabled={creating}
            className="w-full rounded-md border-2 border-gray-300 dark:border-gray-600 py-4 px-4 text-left font-medium text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50"
          >
            Store
          </button>
          <button
            type="button"
            onClick={() => handleChoose("ngo")}
            disabled={creating}
            className="w-full rounded-md border-2 border-gray-300 dark:border-gray-600 py-4 px-4 text-left font-medium text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50"
          >
            NGO
          </button>
        </div>
        {creating && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Creating organization and wallet…
          </p>
        )}
      </div>
    </main>
  );
}
