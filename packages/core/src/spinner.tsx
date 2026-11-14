import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export interface SpinnerProps extends ComponentPropsWithoutRef<"span"> {
  /** Accessible name. Pass `null` when a nearby element already describes the busy state. */
  label?: string | null;
}

export function Spinner({ label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <span
      className={cn("forge-spinner", className)}
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    />
  );
}
