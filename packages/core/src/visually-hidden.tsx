import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export function VisuallyHidden({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn("forge-sr-only", className)} {...props} />;
}
