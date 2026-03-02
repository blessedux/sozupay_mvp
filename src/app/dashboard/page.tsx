import OnboardingChecklist from "@/components/OnboardingChecklist";
import DashboardBalance from "@/components/DashboardBalance";
import DashboardStats from "@/components/DashboardStats";
import DashboardTransactions from "@/components/DashboardTransactions";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Balance, transactions, and DeFi allocation for your organization&apos;s wallet.
      </p>

      <section className="mt-6" aria-label="Key metrics">
        <DashboardStats />
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <DashboardBalance />
        <OnboardingChecklist />
      </div>

      <section className="mt-8" aria-label="Recent activity">
        <DashboardTransactions />
      </section>
    </div>
  );
}
