import { Toaster } from "@forge-ui/notifications";

/** One toaster for the whole docs site, so example buttons can call `notify` anywhere. */
export function Notifications() {
  return <Toaster position="bottom-right" />;
}
