import { CommandPalette, type Command } from "@forge-ui/command-palette";
import { notify } from "@forge-ui/notifications";
import { sleep } from "./_data";

const people = [
  "Ada Lovelace",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Alan Turing",
  "Barbara Liskov",
];

// Replace with your search API. The signal is aborted when the query changes.
async function searchPeople(query: string, signal: AbortSignal): Promise<Command[]> {
  await sleep(350);
  if (signal.aborted || !query.trim()) return [];
  return people
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .map((name) => ({
      id: `person-${name}`,
      label: name,
      description: "Teammate",
      icon: "👤",
      onSelect: () => notify.info(`Opening ${name}`),
    }));
}

const commands: Command[] = [
  {
    id: "repos",
    label: "Open repository…",
    description: "Loads the list when selected",
    loadChildren: async () => {
      await sleep(500);
      return ["forge-ui", "docs", "playground"].map((name) => ({
        id: `repo-${name}`,
        label: name,
        icon: "📦",
        onSelect: () => notify.info(`Opening ${name}`),
      }));
    },
  },
];

export default function CommandPaletteAsync() {
  return (
    <CommandPalette
      commands={commands}
      loadCommands={searchPeople}
      shortcut="mod+j"
      placeholder="Search people or commands…"
    />
  );
}
