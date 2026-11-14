import { useRef, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@forge-ui/core";

export interface ComboboxPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The field that anchors the list, usually an input with its decorations. */
  children: ReactNode;
  /** The list. Rendered in a portal. */
  content: ReactNode;
  className?: string;
  contentClassName?: string;
  "data-disabled"?: boolean | undefined;
  onFieldPointerDown?: () => void;
}

/**
 * Positions a listbox under an input without stealing focus from it.
 * Focus stays in the input the whole time, which is what the ARIA combobox pattern requires.
 */
export function ComboboxPopover({
  open,
  onOpenChange,
  children,
  content,
  className,
  contentClassName,
  onFieldPointerDown,
  ...rest
}: ComboboxPopoverProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>
        <div
          ref={anchorRef}
          className={className}
          onPointerDown={onFieldPointerDown}
          data-disabled={rest["data-disabled"] || undefined}
        >
          {children}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          // The listbox inside carries the real role. A dialog role here would confuse screen readers.
          role="presentation"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={cn("forge-popover forge-cb-content", contentClassName)}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
        >
          {content}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
