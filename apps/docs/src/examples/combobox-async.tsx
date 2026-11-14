import { Combobox, type ComboboxOption } from "@forge-ui/combobox";
import { sleep } from "./_data";

const users = [
  "Ada Lovelace",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Alan Turing",
  "Barbara Liskov",
  "Dennis Ritchie",
  "Radia Perlman",
];

// Stand-in for GET /api/users?q=… The signal cancels the request when the query changes.
async function loadUsers(query: string, signal: AbortSignal): Promise<ComboboxOption[]> {
  await sleep(450);
  if (signal.aborted) return [];
  return users
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .map((name) => ({
      value: name.toLowerCase().replace(/\s+/g, "-"),
      label: name,
      description: `${name.split(" ")[0]?.toLowerCase()}@example.com`,
    }));
}

export default function ComboboxAsync() {
  return (
    <div className="max-w-sm">
      <Combobox
        aria-label="Assignee"
        placeholder="Search people…"
        loadOptions={loadUsers}
        emptyMessage="Nobody matches that search."
        // A value saved earlier: shows its label before any request has run.
        defaultValue="ada-lovelace"
        selectedOptions={[{ value: "ada-lovelace", label: "Ada Lovelace" }]}
        clearable
      />
    </div>
  );
}
