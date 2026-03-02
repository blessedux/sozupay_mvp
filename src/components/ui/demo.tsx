import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DemoProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Dashboard background: black base, visible grey tile grid, and a purple
 * radial gradient at the bottom. Content is rendered above in z-10.
 */
export const Component = ({ children, className }: DemoProps) => {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-black relative overflow-hidden",
        className,
      )}
    >
      {/* Grey tile grid on black - visible grid lines */}
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_4rem]"
        aria-hidden
      />
      {/* Bottom purple hue gradient layer */}
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(125%_125%_at_50%_100%,#6366f1_30%,#4c1d95_60%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Component;
