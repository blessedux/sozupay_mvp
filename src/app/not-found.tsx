import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        404 – Page not found
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 font-medium"
      >
        Go to home
      </Link>
      <Link
        href="/dashboard"
        className="mt-3 text-sm text-gray-500 dark:text-gray-400 underline"
      >
        Dashboard
      </Link>
    </main>
  );
}
