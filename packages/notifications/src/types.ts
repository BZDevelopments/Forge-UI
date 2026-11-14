import type { ReactNode } from "react";

export type NotificationVariant = "default" | "success" | "error" | "warning" | "info" | "loading";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotifyOptions {
  /** Pass an id to update or replace an existing notification instead of adding a new one. */
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: NotificationVariant;
  /** Milliseconds before auto-dismiss. `Infinity` keeps it until dismissed. Defaults to 5000 (loading: Infinity). */
  duration?: number;
  /** 0 to 100. Renders a progress bar. */
  progress?: number;
  action?: NotificationAction;
  /** Adds an Undo button. The notification closes after it runs. */
  undo?: () => void;
  /** Show the close button. Defaults to `true`. */
  dismissible?: boolean;
  /** Replaces the default layout. Keep your own close control reachable by keyboard. */
  render?: (notification: Notification, helpers: { dismiss: () => void }) => ReactNode;
  onDismiss?: (notification: Notification) => void;
}

export interface Notification extends Required<Pick<NotifyOptions, "variant" | "dismissible">> {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  duration: number;
  progress?: number;
  action?: NotificationAction;
  undo?: () => void;
  render?: NotifyOptions["render"];
  onDismiss?: NotifyOptions["onDismiss"];
  /** Bumps whenever the notification is updated, which restarts its timer. */
  revision: number;
}

type MessageOrFn<T> = ReactNode | ((value: T) => ReactNode);
type PromiseOption<T> =
  MessageOrFn<T> | (Omit<NotifyOptions, "variant"> & { title: MessageOrFn<T> });

export interface PromiseMessages<T> {
  loading: ReactNode | Omit<NotifyOptions, "variant">;
  success: PromiseOption<T>;
  error: PromiseOption<unknown>;
}

export type NotifyShortcut = (
  title: ReactNode,
  options?: Omit<NotifyOptions, "title" | "variant">,
) => string;

export interface Notifier {
  (title: ReactNode, options?: NotifyOptions): string;
  success: NotifyShortcut;
  error: NotifyShortcut;
  warning: NotifyShortcut;
  info: NotifyShortcut;
  loading: NotifyShortcut;
  /** Shows a loading notification, then turns it into a success or error. Returns the original promise. */
  promise: <T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: Omit<NotifyOptions, "title" | "variant">,
  ) => Promise<T>;
  update: (id: string, options: NotifyOptions) => void;
  dismiss: (id?: string) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly Notification[];
}
