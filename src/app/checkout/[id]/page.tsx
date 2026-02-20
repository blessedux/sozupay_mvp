"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useParams();
  const search = useSearchParams();
  const amount = search.get("amount") ?? "0";
  const ref = search.get("ref") ?? "";
  const store = search.get("store") ?? "";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
        <h1 className="text-xl font-bold">SozuPay Checkout</h1>
        <p className="mt-4 text-2xl font-bold">{amount} USDC</p>
        {ref && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Ref: {ref}
          </p>
        )}
        {store && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Store: {store}</p>
        )}
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Pay with bank or card. Funds credit the merchant&apos;s SozuPay wallet.
        </p>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Checkout ID: {params.id}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium"
        >
          Return to merchant
        </Link>
      </div>
    </main>
  );
}
