import { HomeSignInButton } from "@/components/HomeSignInButton";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">SozuPay Dashboard</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
        One wallet, one source of truth.
      </p>
      <HomeSignInButton />
    </main>
  );
}
