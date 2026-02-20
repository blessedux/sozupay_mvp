import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">SozuPay Dashboard</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
        One wallet, one source of truth.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium"
      >
        Sign in
      </Link>
    </main>
  );
}
