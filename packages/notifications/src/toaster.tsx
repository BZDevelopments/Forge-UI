import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { announce, cn, matchesShortcut, parseShortcut } from "@forge-ui/core";
import { notify as defaultNotifier } from "./store";
import type { Notification, Notifier } from "./types";

export type ToasterPosition =
  "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToasterProps {
  /** Defaults to the shared `notify` store. */
  notifier?: Notifier;
  position?: ToasterPosition;
  /** How many notifications show at once. The rest wait in the queue. Defaults to 3. */
  limit?: number;
  /** Shortcut that moves focus into the notification region. Pass `false` to disable. Defaults to `alt+t`. */
  hotkey?: string | false;
  /** Accessible name of the region. */
  label?: string;
  className?: string;
}

const GLYPH: Record<Notification["variant"], string> = {
  default: "",
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
  loading: "",
};
const VARIANT_LABEL: Record<Notification["variant"], string | null> = {
  default: null,
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",
  loading: "Loading",
};

function textOf(node: unknown): string {
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}

function Toast({
  notification,
  notifier,
  paused: regionPaused,
}: {
  notification: Notification;
  notifier: Notifier;
  paused: boolean;
}) {
  const {
    id,
    variant,
    title,
    description,
    duration,
    progress,
    action,
    undo,
    dismissible,
    render,
    revision,
  } = notification;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused || regionPaused;
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  // Reset the countdown whenever the notification is updated.
  useEffect(() => {
    remaining.current = duration;
  }, [revision, duration]);

  useEffect(() => {
    if (!Number.isFinite(duration) || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => notifier.dismiss(id), Math.max(remaining.current, 0));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [id, duration, paused, revision, notifier]);

  const dismiss = useCallback(() => notifier.dismiss(id), [notifier, id]);

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      dismiss();
    }
  };

  const label = VARIANT_LABEL[variant];
  return (
    // Hover and focus handlers only pause the countdown. They are not interactions with the toast itself.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      className="forge-toast"
      data-variant={variant}
      aria-label={label ?? "Notification"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      {render ? (
        render(notification, { dismiss })
      ) : (
        <>
          <span className="forge-toast-icon" aria-hidden="true">
            {variant === "loading" ? <span className="forge-spinner" /> : GLYPH[variant]}
          </span>
          <div className="forge-toast-body">
            {label ? <span className="forge-sr-only">{label}: </span> : null}
            {title ? <div className="forge-toast-title">{title}</div> : null}
            {description ? <div className="forge-toast-desc">{description}</div> : null}
            {progress !== undefined ? (
              <div
                className="forge-toast-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={textOf(title) ? `${textOf(title)} progress` : "Progress"}
              >
                <div style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
              </div>
            ) : null}
          </div>
          <div className="forge-toast-actions">
            {undo ? (
              <button
                type="button"
                className="forge-toast-button"
                onClick={() => {
                  undo();
                  dismiss();
                }}
              >
                Undo
              </button>
            ) : null}
            {action ? (
              <button
                type="button"
                className="forge-toast-button"
                onClick={() => {
                  action.onClick();
                  dismiss();
                }}
              >
                {action.label}
              </button>
            ) : null}
            {dismissible ? (
              <button
                type="button"
                className="forge-toast-close"
                aria-label="Dismiss notification"
                onClick={dismiss}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>
        </>
      )}
    </li>
  );
}

export function Toaster({
  notifier = defaultNotifier,
  position = "bottom-right",
  limit = 3,
  hotkey = "alt+t",
  label = "Notifications",
  className,
}: ToasterProps) {
  const all = useSyncExternalStore(notifier.subscribe, notifier.getSnapshot, notifier.getSnapshot);
  const visible = all.slice(0, Math.max(1, limit));
  const queued = all.length - visible.length;
  const regionRef = useRef<HTMLElement>(null);
  const announced = useRef(new Set<string>());

  // Announce each notification once it becomes visible. Updates (revisions) are announced too.
  useEffect(() => {
    for (const item of visible) {
      const key = `${item.id}:${item.revision}`;
      if (announced.current.has(key)) continue;
      announced.current.add(key);
      if (item.render && !item.title) continue;
      const text = [VARIANT_LABEL[item.variant], textOf(item.title), textOf(item.description)]
        .filter(Boolean)
        .join(". ");
      if (text) announce(text, item.variant === "error" ? "assertive" : "polite");
    }
  }, [visible]);

  useEffect(() => {
    if (hotkey === false) return;
    const parsed = parseShortcut(hotkey);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!matchesShortcut(event, parsed)) return;
      event.preventDefault();
      const first = regionRef.current?.querySelector<HTMLElement>(
        "button, [href], [tabindex]:not([tabindex='-1'])",
      );
      (first ?? regionRef.current)?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  return (
    <section
      ref={regionRef}
      aria-label={hotkey ? `${label} (${hotkey.replace(/\+/g, " + ")})` : label}
      tabIndex={-1}
      className={cn("forge-toaster", className)}
      data-position={position}
    >
      <ol className="forge-toast-list">
        {visible.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            notifier={notifier}
            paused={false}
          />
        ))}
      </ol>
      {queued > 0 ? <p className="forge-toast-queued">+{queued} more waiting</p> : null}
    </section>
  );
}
