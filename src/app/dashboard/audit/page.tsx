"use client";

import { useState, useEffect } from "react";

interface AuditEvent {
  id: string;
  at: string;
  type: string;
  message: string;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        Bank account added, recovery method changed, payout to X, etc.
      </p>
      {loading ? (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800" />
          <div className="animate-pulse h-12 bg-gray-50 dark:bg-gray-800/50" />
        </div>
      ) : events.length === 0 ? (
        <p className="mt-6 text-gray-500 dark:text-gray-400">No audit events yet.</p>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((e) => (
              <li key={e.id} className="p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium">{e.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(e.at).toLocaleString()} · {e.type}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
