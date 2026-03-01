"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || "demo@sozupay.demo",
          instant: true, // Mock auth: one click -> dashboard; real auth later
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      if (data.redirect) {
        router.push(data.redirect);
        return;
      }
      setMessage(data.message ?? "Check your email for the magic link.");
      if (data.devLink) setDevLink(data.devLink);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-center">SozuPay</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          Sign in with your email
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com (optional for demo)"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}
          {devLink && (
            <p className="text-sm">
              <a href={devLink} className="text-blue-600 dark:text-blue-400 underline">
                Dev: click here to sign in
              </a>
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2 px-4 font-medium disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
      </div>
    </main>
  );
}
