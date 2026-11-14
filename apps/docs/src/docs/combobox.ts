import type { ComponentDoc } from "./types";
import basic from "../examples/combobox-basic.tsx?raw";
import asyncCode from "../examples/combobox-async.tsx?raw";
import large from "../examples/combobox-large.tsx?raw";
import ComboboxBasic from "../examples/combobox-basic";
import ComboboxAsync from "../examples/combobox-async";
import ComboboxLarge from "../examples/combobox-large";

const sharedProps = [
  {
    name: "options",
    type: "ComboboxOption[]",
    description:
      "Static options. `{ value, label, description?, group?, disabled?, icon?, keywords?, data? }`.",
  },
  {
    name: "loadOptions",
    type: "(query, signal) => Promise<ComboboxOption[]>",
    description: "Async options. Filtering is left to your server. Stale responses are ignored.",
  },
  {
    name: "loadDebounceMs",
    type: "number",
    default: "250",
    description: "Delay before `loadOptions` runs.",
  },
  {
    name: "selectedOptions",
    type: "ComboboxOption[]",
    description:
      "Options for already-selected values that are not in the current list, such as a saved server value.",
  },
  {
    name: "filter",
    type: "(option, query) => boolean",
    description: "Custom local filter. Replaces the fuzzy matcher.",
  },
  { name: "loading", type: "boolean", description: "Show the loading state from outside." },
  {
    name: "emptyMessage / loadingMessage / errorMessage",
    type: "ReactNode",
    description: "Text for each state.",
  },
  {
    name: "renderOption",
    type: "(option, { selected, active, matches }) => ReactNode",
    description: "Custom option rendering.",
  },
  {
    name: "virtualizeThreshold",
    type: "number",
    default: "200",
    description: "Window the list when it has at least this many options.",
  },
  {
    name: "open / defaultOpen / onOpenChange",
    type: "boolean",
    description: "Controlled or uncontrolled list visibility.",
  },
  {
    name: "name",
    type: "string",
    description: "Renders hidden input(s) so the value posts with a native form.",
  },
  { name: "placeholder / disabled / id / className", type: "—", description: "Presentation." },
  {
    name: "aria-label / aria-labelledby / aria-describedby / aria-invalid",
    type: "—",
    description: "Pass one of the label props. Link errors with `aria-describedby`.",
  },
];

export const combobox: ComponentDoc = {
  slug: "combobox",
  name: "Combobox",
  pkg: "combobox",
  summary:
    "A searchable single-select with async options, groups, disabled items, custom rendering, and virtualized lists for thousands of options. It is also the engine that powers the multi-select.",
  keywords: ["combobox", "autocomplete", "select", "search", "typeahead", "async"],
  whenToUse: [
    "A native select would be too long to scan, or people know what they want and want to type it.",
    "Options come from an API and should be searched on the server.",
  ],
  usage: `import { Combobox } from "@forge-ui/combobox";

<Combobox
  aria-label="Country"
  options={countries}
  value={country}
  onValueChange={setCountry}
  clearable
/>`,
  examples: [
    {
      id: "basic",
      title: "Groups, descriptions, disabled options, controlled value",
      description:
        "Type to filter with fuzzy matching (try “gmny”). Disabled options are skipped by the arrow keys.",
      Component: ComboboxBasic,
      code: basic,
    },
    {
      id: "async",
      title: "Async search",
      description:
        "The list loads when opened and again as you type. A saved value shows its label immediately through `selectedOptions`. If a request fails, the list shows the error with a Retry button.",
      Component: ComboboxAsync,
      code: asyncCode,
    },
    {
      id: "large",
      title: "20,000 options",
      description:
        "Windowed rendering keeps the DOM small. Keyboard navigation and `aria-setsize` and `aria-posinset` still describe the full list.",
      Component: ComboboxLarge,
      code: large,
    },
  ],
  api: [
    {
      title: "Combobox props",
      rows: [
        {
          name: "value / defaultValue",
          type: "string | null",
          description: "The selected option's `value`.",
        },
        {
          name: "onValueChange",
          type: "(value, option) => void",
          description: "Called with the new value and its option, or `null, null` when cleared.",
        },
        {
          name: "clearable",
          type: "boolean",
          default: "false",
          description: "Shows a clear button when there is a value.",
        },
        ...sharedProps,
      ],
    },
    {
      title: "Headless pieces",
      description:
        "`useCombobox`, `ComboboxList`, and `ComboboxPopover` are exported for building your own variants. The multi-select is built from them.",
      rows: [
        {
          name: "useCombobox",
          type: "(options) => state",
          description:
            "Query, open state, filtering, grouping, async loading, active option, and keyboard handling.",
        },
        {
          name: "ComboboxList",
          type: "component",
          description: "The listbox, with groups, windowing, and status messages.",
        },
        {
          name: "ComboboxPopover",
          type: "component",
          description: "Positions the list under the field without stealing focus from the input.",
        },
      ],
    },
  ],
  keyboard: [
    {
      keys: "↓ / ↑",
      action: "Open the list, then move the active option (wraps, skips disabled).",
    },
    { keys: "Page Down / Page Up", action: "Move ten options." },
    {
      keys: "Home / End",
      action: "First or last option while the input is not being edited, or with Ctrl/⌘.",
    },
    {
      keys: "Enter",
      action: "Choose the active option. Never submits a surrounding form while the list is open.",
    },
    { keys: "Escape", action: "Close the list." },
    { keys: "Tab", action: "Close the list and move on." },
  ],
  accessibility: [
    'Implements the ARIA 1.2 combobox pattern: the input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and `aria-autocomplete="list"`.',
    "Focus never leaves the input. Clicking an option does not blur it.",
    'Options use `role="option"` with `aria-selected` and `aria-disabled`. Groups are labelled. Long lists add `aria-setsize` and `aria-posinset`.',
    "Loading sets `aria-busy` and announces status. Errors are alerts with a Retry button.",
  ],
  customization: [
    "Use `renderOption` for rich rows, and `filter` for your own matching.",
    "Restyle `.forge-cb-*` classes, or set the `--forge-*` variables. The popup width follows the field.",
  ],
  mistakes: [
    "Using `loadOptions` without handling the abort `signal`.",
    "Passing a new `options` array every render. Memoize large lists.",
    "Forgetting `selectedOptions` for a saved async value, which leaves the field blank until options load.",
  ],
};

export { sharedProps };
