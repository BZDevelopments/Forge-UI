import { MultiSelect } from "@forge-ui/multi-select";

const labels = [
  "Bug",
  "Feature",
  "Docs",
  "Design",
  "Performance",
  "Security",
  "Accessibility",
  "Refactor",
];
const options = labels.map((label) => ({ value: label.toLowerCase(), label }));

export default function MultiSelectLimit() {
  return (
    <div className="max-w-md space-y-2">
      <p className="text-sm text-forge-muted">
        Pick up to three labels. Extra choices are ignored and announced.
      </p>
      <MultiSelect
        aria-label="Issue labels"
        placeholder="Add labels…"
        options={options}
        maxSelected={3}
        maxVisibleTags={2}
        defaultValue={["bug", "docs", "security"]}
      />
    </div>
  );
}
