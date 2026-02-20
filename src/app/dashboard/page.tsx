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
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Your business finance at a glance. Payments are received in fiat and stored in USD.
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
