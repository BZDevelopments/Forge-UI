import { MultiSelect, type ComboboxOption } from "@forge-ui/multi-select";
import { sleep } from "./_data";

const people = [
  "Ada Lovelace",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Alan Turing",
  "Barbara Liskov",
];

async function loadPeople(query: string, signal: AbortSignal): Promise<ComboboxOption[]> {
  await sleep(400);
  if (signal.aborted) return [];
  return people
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .map((name) => ({ value: name.toLowerCase().replace(/\s+/g, "-"), label: name }));
}

export default function MultiSelectAsync() {
  return (
    <div className="max-w-md">
      <MultiSelect
        aria-label="Reviewers"
        placeholder="Search reviewers…"
        loadOptions={loadPeople}
        closeOnSelect={false}
      />
    </div>
  );
}
