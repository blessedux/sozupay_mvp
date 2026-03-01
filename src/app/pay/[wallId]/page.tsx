import { notFound } from "next/navigation";

/**
 * Public payment wall page. Customer sees amount and pays via on-ramp.
 * On-ramp integration is via adapter; this page shows placeholder and shareable link.
 */
async function getWall(wallId: string) {
  // Server-side we don't have in-memory store in same process if deployed; use API
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/walls/public/${wallId}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return null;
  const d = await res.json().catch(() => ({}));
  return d.wall ?? null;
}

export default async function PayWallPage({
  params,
}: {
  params: Promise<{ wallId: string }>;
}) {
  const { wallId } = await params;
  const wall = await getWall(wallId);
  if (!wall) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
        <h1 className="text-xl font-bold">{wall.name}</h1>
        <p className="mt-4 text-2xl font-bold">{wall.defaultAmount} USDC</p>
        {wall.reference && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {wall.reference}
          </p>
        )}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Pay with bank or card (on-ramp). Funds convert to USDC and credit the merchant.
        </p>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          On-ramp adapter integration point — connect your provider in dashboard.           
        </p>
      </div>
    </main>
  );
}
