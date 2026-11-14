import { useState } from "react";
import { MultiSelect, type ComboboxOption } from "@forge-ui/multi-select";

const skills: ComboboxOption[] = [
  { value: "ts", label: "TypeScript", group: "Languages" },
  { value: "rust", label: "Rust", group: "Languages" },
  { value: "go", label: "Go", group: "Languages" },
  { value: "react", label: "React", group: "Frameworks" },
  { value: "svelte", label: "Svelte", group: "Frameworks" },
  { value: "vue", label: "Vue", group: "Frameworks" },
  {
    value: "cobol",
    label: "COBOL",
    group: "Languages",
    disabled: true,
    description: "Position filled",
  },
];

export default function MultiSelectBasic() {
  const [value, setValue] = useState<string[]>(["ts", "react"]);
  return (
    <div className="max-w-md space-y-2">
      <span id="skills-label" className="block text-sm font-medium">
        Skills
      </span>
      <MultiSelect
        aria-labelledby="skills-label"
        placeholder="Add skills…"
        options={skills}
        value={value}
        onValueChange={setValue}
        clearable
        name="skills"
      />
      <p className="text-sm text-forge-muted">{value.length} selected</p>
    </div>
  );
}
