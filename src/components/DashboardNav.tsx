"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardProfile } from "@/contexts/DashboardProfileContext";

function NavLink({
  href,
  label,
  indent = false,
}: {
  href: string;
  label: string;
  indent?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      prefetch={true}
      className={`block rounded-md text-sm font-medium ${
        indent ? "pl-6 pr-3 py-1.5" : "px-3 py-2"
      } ${
        isActive
          ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {label}
    </Link>
  );
}

export function DashboardNav() {
  const { profile } = useDashboardProfile() ?? { profile: null };
  const isAdmin =
    profile?.admin_level === "admin" || profile?.admin_level === "super_admin";

  return (
    <nav className="mt-6 flex flex-col flex-1 min-h-0">
      <div className="space-y-1">
        <NavLink href="/dashboard" label="Overview" />
        <NavLink href="/dashboard/transactions" label="Transactions" />
        <NavLink href="/dashboard/audit" label="Audit log" indent />
        <NavLink href="/dashboard/vault" label="Vault" />
        <NavLink href="/dashboard/credit" label="Credit" />
        <NavLink href="/dashboard/walls" label="Payment walls" />
        <NavLink href="/dashboard/payouts" label="Payouts" />
        <NavLink href="/dashboard/recipients" label="Recipients" />
        <NavLink href="/dashboard/profile" label="Profile" />
        {isAdmin && <NavLink href="/dashboard/admin" label="Admin" indent />}
        <NavLink href="/dashboard/keys" label="Keys & custody" indent />
      </div>
      <div className="mt-auto pt-4 border-t border-white/10">
        <form action="/api/auth/logout" method="POST" className="block">
          <button
            type="submit"
            className="w-full text-left block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
