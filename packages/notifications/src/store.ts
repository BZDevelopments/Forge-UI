import type {
  Notification,
  Notifier,
  NotifyOptions,
  NotifyShortcut,
  PromiseMessages,
} from "./types";

export const DEFAULT_DURATION = 5000;

let counter = 0;

function defaultDuration(variant: Notification["variant"]): number {
  return variant === "loading" ? Infinity : DEFAULT_DURATION;
}

/**
 * Creates an independent notification store. The default `notify` export uses one of these,
 * and you can create more for tests, server rendering, or separate regions of an app.
 */
export function createNotifier(): Notifier {
  let items: readonly Notification[] = [];
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const set = (next: readonly Notification[]) => {
    items = next;
    emit();
  };

  const add = (title: NotifyOptions["title"], options: NotifyOptions = {}): string => {
    const id = options.id ?? `forge-notification-${++counter}`;
    const variant = options.variant ?? "default";
    const existing = items.find((item) => item.id === id);
    const notification: Notification = {
      id,
      variant,
      title,
      description: options.description,
      duration: options.duration ?? defaultDuration(variant),
      progress: options.progress,
      action: options.action,
      undo: options.undo,
      dismissible: options.dismissible ?? true,
      render: options.render,
      onDismiss: options.onDismiss,
      revision: (existing?.revision ?? 0) + 1,
    };
    set(
      existing
        ? items.map((item) => (item.id === id ? notification : item))
        : [...items, notification],
    );
    return id;
  };

  const update = (id: string, options: NotifyOptions) => {
    const existing = items.find((item) => item.id === id);
    if (!existing) return;
    const variant = options.variant ?? existing.variant;
    const durationChanged = options.duration !== undefined || options.variant !== undefined;
    const next: Notification = {
      ...existing,
      ...(options.title !== undefined ? { title: options.title } : null),
      ...(options.description !== undefined ? { description: options.description } : null),
      ...(options.progress !== undefined ? { progress: options.progress } : null),
      ...(options.action !== undefined ? { action: options.action } : null),
      ...(options.undo !== undefined ? { undo: options.undo } : null),
      ...(options.dismissible !== undefined ? { dismissible: options.dismissible } : null),
      ...(options.render !== undefined ? { render: options.render } : null),
      ...(options.onDismiss !== undefined ? { onDismiss: options.onDismiss } : null),
      variant,
      duration: durationChanged
        ? (options.duration ?? defaultDuration(variant))
        : existing.duration,
      // Pure progress updates should not restart the auto-dismiss timer.
      revision:
        options.progress !== undefined && Object.keys(options).length === 1
          ? existing.revision
          : existing.revision + 1,
    };
    set(items.map((item) => (item.id === id ? next : item)));
  };

  const dismiss = (id?: string) => {
    const removed = id ? items.filter((item) => item.id === id) : items;
    if (removed.length === 0) return;
    set(id ? items.filter((item) => item.id !== id) : []);
    for (const item of removed) item.onDismiss?.(item);
  };

  const shortcut =
    (variant: Notification["variant"]): NotifyShortcut =>
    (title, options) =>
      add(title, { ...options, variant });

  const notifier = ((title, options) => add(title, options)) as Notifier;
  notifier.success = shortcut("success");
  notifier.error = shortcut("error");
  notifier.warning = shortcut("warning");
  notifier.info = shortcut("info");
  notifier.loading = shortcut("loading");
  notifier.update = update;
  notifier.dismiss = dismiss;
  notifier.subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  notifier.getSnapshot = () => items;

  notifier.promise = <T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options: Omit<NotifyOptions, "title" | "variant"> = {},
  ) => {
    const loading = messages.loading;
    const loadingOptions =
      loading && typeof loading === "object" && "title" in (loading as object)
        ? (loading as NotifyOptions)
        : { title: loading as NotifyOptions["title"] };
    const id = add(loadingOptions.title, {
      ...options,
      ...loadingOptions,
      variant: "loading",
      id: options.id,
    });

    const settle = <V>(variant: "success" | "error", value: V, spec: unknown) => {
      const resolve = (entry: unknown): NotifyOptions["title"] =>
        typeof entry === "function"
          ? (entry as (v: V) => NotifyOptions["title"])(value)
          : (entry as NotifyOptions["title"]);
      const isOptions =
        spec &&
        typeof spec === "object" &&
        !Array.isArray(spec) &&
        "title" in (spec as object) &&
        !("$$typeof" in (spec as object));
      const extra = isOptions ? (spec as NotifyOptions) : {};
      update(id, {
        ...extra,
        title: resolve(isOptions ? (spec as { title: unknown }).title : spec),
        variant,
        duration: extra.duration ?? options.duration ?? DEFAULT_DURATION,
        progress: undefined,
      });
    };

    promise.then(
      (value) => settle("success", value, messages.success),
      (error: unknown) => settle("error", error, messages.error),
    );
    return promise;
  };

  return notifier;
}

/** The shared notifier used by `<Toaster />` when no `notifier` prop is passed. */
export const notify: Notifier = createNotifier();
