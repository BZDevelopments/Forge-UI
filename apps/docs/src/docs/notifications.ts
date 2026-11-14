import type { ComponentDoc } from "./types";
import basic from "../examples/notifications-basic.tsx?raw";
import advanced from "../examples/notifications-advanced.tsx?raw";
import NotificationsBasic from "../examples/notifications-basic";
import NotificationsAdvanced from "../examples/notifications-advanced";

export const notifications: ComponentDoc = {
  slug: "notifications",
  name: "Notifications",
  pkg: "notifications",
  summary:
    "Toasts you can trigger from anywhere with `notify`. Variants, promise helpers, undo, progress, queues, custom rendering, and screen reader announcements.",
  keywords: ["toast", "notification", "snackbar", "alert", "promise", "undo", "queue"],
  whenToUse: [
    "You confirm that something happened, report a background result, or offer a quick undo.",
    "Don't use a toast for errors a person must fix to continue. Show those inline, next to the problem.",
  ],
  usage: `import { Toaster, notify } from "@forge-ui/notifications";

// Once, near the root of your app:
<Toaster />

// Anywhere:
notify.promise(saveData(), {
  loading: "Saving...",
  success: "Saved successfully",
  error: "Unable to save",
});`,
  examples: [
    {
      id: "basic",
      title: "Variants, actions, and promises",
      description:
        "`notify.promise` shows a loading toast, then turns it into a success or error. It returns your original promise, so you can still await it.",
      Component: NotificationsBasic,
      code: basic,
    },
    {
      id: "advanced",
      title: "Undo, progress, and queues",
      description:
        "Delete an item and press Undo. Update a toast's progress in place. Queue six toasts: three show and the rest wait, and each toast's timer starts only once it is visible.",
      Component: NotificationsAdvanced,
      code: advanced,
    },
  ],
  api: [
    {
      title: "notify",
      rows: [
        {
          name: "notify(title, options?)",
          type: "string",
          description: "Show a notification and get its id.",
        },
        {
          name: "notify.success / error / warning / info / loading",
          type: "(title, options?) => string",
          description: "Variant shortcuts. Loading toasts do not auto-dismiss.",
        },
        {
          name: "notify.promise(promise, messages, options?)",
          type: "Promise<T>",
          description:
            "`messages` has `loading`, `success`, and `error`, each a string, a function of the result, or an options object.",
        },
        {
          name: "notify.update(id, options)",
          type: "void",
          description:
            "Change a notification in place, for example its progress. Updates restart the dismiss timer unless only `progress` changes.",
        },
        {
          name: "notify.dismiss(id?)",
          type: "void",
          description: "Dismiss one notification, or all.",
        },
        {
          name: "createNotifier()",
          type: "Notifier",
          description:
            "An independent store, for tests or separate regions. Pass it to `<Toaster notifier={…} />`.",
        },
      ],
    },
    {
      title: "Options",
      rows: [
        { name: "title / description", type: "ReactNode", description: "Content." },
        {
          name: "duration",
          type: "number",
          default: "5000",
          description: "Milliseconds. `Infinity` keeps it until dismissed.",
        },
        { name: "progress", type: "number", description: "0 to 100. Shows a progress bar." },
        {
          name: "action",
          type: "{ label, onClick }",
          description: "A button. The notification closes after it runs.",
        },
        { name: "undo", type: "() => void", description: "Adds an Undo button." },
        { name: "id", type: "string", description: "Reuse an id to update instead of adding." },
        {
          name: "dismissible",
          type: "boolean",
          default: "true",
          description: "Shows the close button.",
        },
        {
          name: "render",
          type: "(notification, { dismiss }) => ReactNode",
          description: "Replace the layout. Keep a close control reachable by keyboard.",
        },
        { name: "onDismiss", type: "(notification) => void", description: "Called when removed." },
      ],
    },
    {
      title: "Toaster props",
      rows: [
        {
          name: "position",
          type: "top-left | top-center | top-right | bottom-left | bottom-center | bottom-right",
          default: '"bottom-right"',
          description: "Where toasts appear. On small screens they span the width.",
        },
        {
          name: "limit",
          type: "number",
          default: "3",
          description: "Visible at once. Others wait in the queue.",
        },
        {
          name: "hotkey",
          type: "string | false",
          default: '"alt+t"',
          description: "Moves focus into the notification region.",
        },
        {
          name: "notifier / label / className",
          type: "—",
          description: "Use a custom store, rename the region, or add classes.",
        },
      ],
    },
  ],
  keyboard: [
    { keys: "Alt+T", action: "Move focus to the notifications so actions and Undo are reachable." },
    { keys: "Tab", action: "Move between a toast's buttons." },
    { keys: "Escape", action: "Dismiss the focused toast." },
  ],
  accessibility: [
    "Each toast is announced once through a live region: polite for most, assertive for errors. Updates are announced too.",
    "Variants include a text label for assistive tech (“Error:”) and an icon, never color alone.",
    "The countdown pauses while a toast is hovered or focused, so there is time to read and act.",
    "Actions are real buttons and reachable by keyboard with the hotkey, so toasts with Undo are not mouse-only.",
  ],
  customization: [
    "Style `.forge-toast*` classes, or the variables for color, radius, and shadow.",
    "Use `render` for fully custom layouts. Make them as short-lived as the content warrants.",
  ],
  mistakes: [
    "Relying on a toast alone for important results. Toasts disappear.",
    "Mounting more than one `<Toaster />` on the shared store, which shows every toast twice.",
    "Very short durations for toasts that have actions.",
  ],
};
