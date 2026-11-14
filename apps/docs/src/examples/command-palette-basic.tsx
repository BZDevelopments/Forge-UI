import { useState } from "react";
import { CommandPalette, type Command } from "@forge-ui/command-palette";
import { Button } from "@forge-ui/core";
import { notify } from "@forge-ui/notifications";
import { sleep } from "./_data";

const commands: Command[] = [
  {
    id: "dashboard",
    label: "Go to dashboard",
    group: "Navigation",
    icon: "🏠",
    keywords: ["home"],
    onSelect: () => notify.info("Navigating to the dashboard"),
  },
  {
    id: "settings",
    label: "Open settings",
    group: "Navigation",
    icon: "⚙️",
    shortcut: "mod+,",
    onSelect: () => notify.info("Opening settings"),
  },
  {
    id: "theme",
    label: "Change theme…",
    group: "Preferences",
    icon: "🎨",
    children: [
      {
        id: "theme-light",
        label: "Light",
        onSelect: () => document.documentElement.classList.remove("dark"),
      },
      {
        id: "theme-dark",
        label: "Dark",
        onSelect: () => document.documentElement.classList.add("dark"),
      },
    ],
  },
  {
    id: "deploy",
    label: "Deploy to production",
    description: "Runs an async command and closes when it finishes",
    group: "Actions",
    icon: "🚀",
    onSelect: async () => {
      await sleep(1200);
      notify.success("Deployed");
    },
  },
  {
    id: "fail",
    label: "Run a failing command",
    description: "Shows the error and keeps the palette open",
    group: "Actions",
    icon: "💥",
    onSelect: async () => {
      await sleep(500);
      throw new Error("The command failed: remote refused the connection");
    },
  },
  { id: "archive", label: "Archive project", group: "Actions", disabled: true },
];

export default function CommandPaletteBasic() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open palette (or press Ctrl/⌘ K)</Button>
      <CommandPalette commands={commands} open={open} onOpenChange={setOpen} recent />
    </>
  );
}
