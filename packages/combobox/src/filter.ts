import { fuzzyMatch } from "@forge-ui/core";
import type { ComboboxOption } from "./types";

export interface FilteredOption {
  option: ComboboxOption;
  matches: number[];
}

/** Fuzzy filter and rank. With an empty query every option is kept in its original order. */
export function filterOptions(
  options: ComboboxOption[],
  query: string,
  custom?: (option: ComboboxOption, query: string) => boolean,
): FilteredOption[] {
  const q = query.trim();
  if (!q) return options.map((option) => ({ option, matches: [] }));
  if (custom)
    return options.filter((option) => custom(option, q)).map((option) => ({ option, matches: [] }));

  const scored: Array<FilteredOption & { score: number }> = [];
  for (const option of options) {
    const label = fuzzyMatch(q, option.label);
    let best = label ? { score: label.score, matches: label.indices } : null;
    for (const text of [...(option.keywords ?? []), option.description ?? ""]) {
      if (!text) continue;
      const hit = fuzzyMatch(q, text);
      if (hit && (!best || hit.score - 10 > best.score))
        best = { score: hit.score - 10, matches: [] };
    }
    if (best) scored.push({ option, ...best });
  }
  return scored.sort((a, b) => b.score - a.score);
}

export interface Section {
  key: string;
  label?: string;
  items: FilteredOption[];
}

/** Groups options by `group`, keeping first-seen order. Ungrouped options come first without a heading. */
export function groupOptions(items: FilteredOption[], keepRanking: boolean): Section[] {
  if (keepRanking) return items.length ? [{ key: "all", items }] : [];
  const order: string[] = [];
  const map = new Map<string, FilteredOption[]>();
  for (const item of items) {
    const group = item.option.group ?? "";
    if (!map.has(group)) {
      map.set(group, []);
      order.push(group);
    }
    map.get(group)!.push(item);
  }
  if (order.length === 1 && order[0] === "") return [{ key: "all", items: map.get("")! }];
  return order.map((group) => ({
    key: `group:${group}`,
    label: group || undefined,
    items: map.get(group)!,
  }));
}
