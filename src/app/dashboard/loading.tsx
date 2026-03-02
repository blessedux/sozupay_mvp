export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full max-w-xl rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
