"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DashboardProfile = {
  needsPayoutWalletSetup?: boolean;
  needsOrgCreation?: boolean;
  admin_level?: string | null;
  org_id?: string | null;
};

const DashboardProfileContext = createContext<{
  profile: DashboardProfile | null;
  loading: boolean;
  refetch: () => void;
} | null>(null);

export function useDashboardProfile() {
  const ctx = useContext(DashboardProfileContext);
  return ctx;
}

export function DashboardProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: DashboardProfile) => {
        setProfile(p);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <DashboardProfileContext.Provider
      value={{ profile, loading, refetch: fetchProfile }}
    >
      {children}
    </DashboardProfileContext.Provider>
  );
}
