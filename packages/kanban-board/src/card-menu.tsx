import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import type { KanbanCardAction } from "./types";

interface CardMenuProps {
  title: string;
  actions: KanbanCardAction[];
}

/** A small menu button. Arrow keys move between items, Escape closes and returns focus. */
export function CardMenu({ title, actions }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const focus = (i: number) => list[(i + list.length) % list.length]?.focus();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focus(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focus(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focus(0);
        break;
      case "End":
        event.preventDefault();
        focus(list.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  if (actions.length === 0) return null;

  return (
    // Keys are handled here, in one place, for the trigger and the menu items inside it.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="forge-kb-menu" onKeyDown={onMenuKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="forge-kb-icon-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for ${title}`}
        onClick={() => {
          setOpen((value) => !value);
          requestAnimationFrame(() => items()[0]?.focus());
        }}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${title}`}
          className="forge-popover forge-kb-menu-panel"
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null) &&
              event.relatedTarget !== triggerRef.current
            ) {
              setOpen(false);
            }
          }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="forge-kb-menu-item"
              data-danger={action.danger || undefined}
              onClick={() => {
                close(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
