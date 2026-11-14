import type { ComponentDoc } from "./types";
import { sharedProps } from "./combobox";
import basic from "../examples/multi-select-basic.tsx?raw";
import limit from "../examples/multi-select-limit.tsx?raw";
import asyncCode from "../examples/multi-select-async.tsx?raw";
import MultiSelectBasic from "../examples/multi-select-basic";
import MultiSelectLimit from "../examples/multi-select-limit";
import MultiSelectAsync from "../examples/multi-select-async";

export const multiSelect: ComponentDoc = {
  slug: "multi-select",
  name: "Multi-select",
  pkg: "multi-select",
  summary:
    "A searchable multi-select with removable tags, grouping, async options, selection limits, and large-list support. Built on the Forge UI combobox, so keyboard and screen reader behavior match.",
  keywords: ["multi select", "multiselect", "tags", "chips", "select", "async"],
  extraStyles: ["combobox"],
  whenToUse: [
    "People choose several items from a long or remote list: labels, reviewers, skills, filters.",
  ],
  usage: `import { MultiSelect } from "@forge-ui/multi-select";

<MultiSelect
  aria-label="Skills"
  options={skills}
  value={value}
  onValueChange={setValue}
/>`,
  examples: [
    {
      id: "basic",
      title: "Tags, groups, clear all",
      description:
        "The list stays open while you pick several. Backspace on an empty input removes the last tag.",
      Component: MultiSelectBasic,
      code: basic,
    },
    {
      id: "limit",
      title: "Selection limit and collapsed tags",
      description:
        "`maxSelected` ignores extra choices and announces why. `maxVisibleTags` collapses the rest into “+N more” while the list is closed.",
      Component: MultiSelectLimit,
      code: limit,
    },
    {
      id: "async",
      title: "Async options",
      description:
        "Selected tags keep their labels even when they are no longer in the current search results.",
      Component: MultiSelectAsync,
      code: asyncCode,
    },
  ],
  api: [
    {
      title: "MultiSelect props",
      rows: [
        { name: "value / defaultValue", type: "string[]", description: "Selected values." },
        {
          name: "onValueChange",
          type: "(values, options) => void",
          description: "Called with the new values and their option objects.",
        },
        {
          name: "clearable",
          type: "boolean",
          default: "false",
          description: "Adds a Clear all button.",
        },
        {
          name: "maxSelected",
          type: "number",
          description: "Upper limit. Extra choices are ignored and announced.",
        },
        {
          name: "closeOnSelect",
          type: "boolean",
          default: "false",
          description: "Close the list after each choice.",
        },
        {
          name: "maxVisibleTags",
          type: "number",
          description: "Collapse extra tags into “+N more” while closed.",
        },
        ...sharedProps.filter((row) => !["name"].includes(row.name)),
        {
          name: "name",
          type: "string",
          description:
            "Renders one hidden input per selected value, so a native form posts them all.",
        },
      ],
    },
  ],
  keyboard: [
    { keys: "↓ / ↑ / Enter", action: "Open the list, move, and toggle the active option." },
    { keys: "Backspace (empty input)", action: "Remove the last tag." },
    { keys: "Tab to a tag's ✕ button", action: "Remove that tag with Enter or Space." },
    { keys: "Escape", action: "Close the list." },
  ],
  accessibility: [
    "The same combobox pattern as the single select, with `aria-multiselectable` on the listbox.",
    "Selected options are a labelled list of tags. Each remove button names its tag (“Remove Grace Hopper”).",
    "Adding, removing, clearing, and hitting the limit are announced with the running count.",
  ],
  customization: [
    "Style `.forge-ms-*` classes. Tags are plain list items, so you can restyle them freely.",
    "Use `renderOption` to show avatars or counts inside the list.",
  ],
  mistakes: [
    "Using `value` without `onValueChange` (a read-only field).",
    "Expecting `maxSelected` to prevent the user from trying. It announces the limit but does not hide options.",
  ],
};
