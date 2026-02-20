export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4" aria-label="Dashboard navigation">
        <h2 className="font-semibold text-lg">SozuPay</h2>
        <nav className="mt-6 space-y-1">
          <a
            href="/dashboard"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700"
          >
            Overview
          </a>
          <a
            href="/dashboard/transactions"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Transactions
          </a>
          <a
            href="/dashboard/vault"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Vault
          </a>
          <a
            href="/dashboard/walls"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Payment walls
          </a>
          <a
            href="/dashboard/payouts"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Payouts
          </a>
          <a
            href="/dashboard/recipients"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Recipients
          </a>
          <a
            href="/dashboard/keys"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Keys & custody
          </a>
          <a
            href="/dashboard/audit"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Audit log
          </a>
          <a
            href="/dashboard/settings"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Settings
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8" role="main">{children}</main>
    </div>
  );
}
