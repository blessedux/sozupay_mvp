"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * Renders children immediately; loads PrivyProviderWrapper after mount so the app shell
 * paints without waiting for the Privy bundle. UX unchanged: login and auth work once loaded.
 */
export function LazyPrivyWrapper({ children }: { children: ReactNode }) {
  const [PrivyWrapper, setPrivyWrapper] = useState<
    null | React.ComponentType<{ children: ReactNode }>
  >(null);

  useEffect(() => {
    import("@/components/PrivyProviderWrapper").then((mod) =>
      setPrivyWrapper(() => mod.PrivyProviderWrapper)
    );
  }, []);

  if (!PrivyWrapper) return <>{children}</>;
  return <PrivyWrapper>{children}</PrivyWrapper>;
}
