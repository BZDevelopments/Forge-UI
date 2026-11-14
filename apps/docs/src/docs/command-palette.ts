import type { ComponentDoc } from "./types";
import basic from "../examples/command-palette-basic.tsx?raw";
import asyncCode from "../examples/command-palette-async.tsx?raw";
import CommandPaletteBasic from "../examples/command-palette-basic";
import CommandPaletteAsync from "../examples/command-palette-async";

export const commandPalette: ComponentDoc = {
  slug: "command-palette",
  name: "Command palette",
  pkg: "command-palette",
  summary:
    "A keyboard-first launcher with fuzzy search, grouped and nested commands, async commands and async results, and recent history. It works with a touch screen too.",
  keywords: ["command", "palette", "cmdk", "spotlight", "search", "launcher", "shortcut"],
  whenToUse: [
    "Your app has many actions or destinations and people want to reach them without hunting through menus.",
    "You want one place to search commands and remote records together.",
  ],
  usage: `import { CommandPalette } from "@forge-ui/command-palette";

<CommandPalette
  commands={commands}
  shortcut="mod+k"
  onSelect={handleCommand}
/>`,
  examples: [
    {
      id: "basic",
      title: "Groups, nesting, async commands, and recents",
      description:
        "Press the button or Ctrl/⌘ K. “Change theme…” opens a second level (Backspace or Escape goes back). “Deploy” is async: the row shows a spinner and the palette closes when it resolves. The failing command keeps the palette open and shows the error.",
      Component: CommandPaletteBasic,
      code: basic,
    },
    {
      id: "async",
      title: "Async results and lazy children",
      description:
        "`loadCommands` fetches results for the current query (debounced, with stale responses ignored). Press Ctrl/⌘ J, then type a name. “Open repository…” loads its children only when selected.",
      Component: CommandPaletteAsync,
      code: asyncCode,
    },
  ],
  api: [
    {
      title: "CommandPalette props",
      rows: [
        { name: "commands", type: "Command[]", description: "The top-level commands." },
        {
          name: "onSelect",
          type: "(command) => void",
          description:
            "Called after any command runs successfully, in addition to its own `onSelect`.",
        },
        {
          name: "open / defaultOpen / onOpenChange",
          type: "boolean",
          description: "Controlled or uncontrolled visibility.",
        },
        {
          name: "shortcut",
          type: "string | false",
          default: '"mod+k"',
          description: "Global toggle. `mod` is ⌘ on Apple devices and Ctrl elsewhere.",
        },
        {
          name: "loadCommands",
          type: "(query, signal) => Promise<Command[]>",
          description:
            "Async results for the query, shown under the results heading. The signal aborts when the query changes.",
        },
        {
          name: "loadDebounceMs",
          type: "number",
          default: "200",
          description: "Delay before `loadCommands` runs.",
        },
        {
          name: "loading",
          type: "boolean",
          default: "false",
          description: "Show the loading state from outside.",
        },
        {
          name: "recent",
          type: "boolean | { limit?, storageKey? }",
          description: "Remember used commands. `storageKey: null` keeps history in memory only.",
        },
        {
          name: "label / placeholder / emptyMessage / resultsLabel",
          type: "string / ReactNode",
          description: "Text, for localization.",
        },
        { name: "footer", type: "ReactNode", description: "Extra content in the footer bar." },
      ],
    },
    {
      title: "Command",
      rows: [
        { name: "id", type: "string", description: "Unique and stable. Used for recent history." },
        { name: "label", type: "string", description: "Display and search text." },
        {
          name: "description / keywords",
          type: "string / string[]",
          description: "Shown below the label, and extra search terms.",
        },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
        {
          name: "shortcut",
          type: "string",
          description: "Display-only hint. Forge UI does not bind it.",
        },
        { name: "group", type: "string", description: "Heading the command appears under." },
        { name: "disabled", type: "boolean", description: "Visible but not selectable." },
        {
          name: "children / loadChildren",
          type: "Command[] / (signal) => Promise<Command[]>",
          description: "Opens a second level, immediately or on demand.",
        },
        {
          name: "onSelect",
          type: "(command) => unknown",
          description:
            "Runs when selected. Return a promise to show a pending state; if it rejects the error is shown and the palette stays open.",
        },
        { name: "keepOpen", type: "boolean", description: "Do not close after running." },
      ],
    },
  ],
  keyboard: [
    { keys: "Ctrl/⌘ K", action: "Open or close (configurable)." },
    { keys: "↑ / ↓", action: "Move through results, wrapping at the ends." },
    { keys: "Ctrl/⌘ Home / End", action: "First or last result." },
    { keys: "Enter", action: "Run the active command." },
    { keys: "Backspace (empty input)", action: "Go back one level." },
    { keys: "Escape", action: "Go back one level, or close at the top level." },
  ],
  accessibility: [
    "Follows the ARIA combobox pattern. Focus stays in the input and `aria-activedescendant` points at the active option.",
    "The palette is a modal dialog with a name, a focus trap, and focus return to the element that opened it.",
    "The number of results is announced as you type. Pending and failed commands are announced.",
    "Matches are highlighted with `<mark>`, so the highlight is not conveyed by color alone and never injects HTML.",
  ],
  customization: [
    "Use `className` on the dialog, or override `.forge-cp-*` classes and the `--forge-*` variables.",
    "Display your own shortcuts with `formatShortcut` from `@forge-ui/core`, which prints ⌘K on macOS and Ctrl K elsewhere.",
  ],
  mistakes: [
    "Generating command ids on every render. Recent history is keyed by id.",
    "Rendering your own `Ctrl+K` handler as well. Set `shortcut={false}` if you bind the key elsewhere.",
    "Ignoring the abort signal in `loadCommands`, which wastes requests as people type.",
  ],
};
