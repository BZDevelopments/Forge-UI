import { fuzzyMatch } from "@forge-ui/core";
import type { Command } from "./types";

export interface ScoredCommand {
  command: Command;
  /** Matched character positions within the label. */
  indices: number[];
  score: number;
}

/** Filters and ranks commands for a query. An empty query keeps the original order. */
export function searchCommands(commands: Command[], query: string): ScoredCommand[] {
  if (!query.trim()) return commands.map((command) => ({ command, indices: [], score: 0 }));

  const results: ScoredCommand[] = [];
  for (const command of commands) {
    const label = fuzzyMatch(query, command.label);
    // Label matches win. Fall back to keywords, description, and group with a penalty.
    let best = label ? { score: label.score, indices: label.indices } : null;
    const fallbacks = [...(command.keywords ?? []), command.description ?? "", command.group ?? ""];
    for (const text of fallbacks) {
      if (!text) continue;
      const match = fuzzyMatch(query, text);
      if (match && (!best || match.score - 10 > best.score))
        best = { score: match.score - 10, indices: [] };
    }
    if (best) results.push({ command, ...best });
  }
  return results.sort((a, b) => b.score - a.score);
}

export function flattenCommands(commands: Command[]): Map<string, Command> {
  const map = new Map<string, Command>();
  const visit = (list: Command[]) => {
    for (const command of list) {
      map.set(command.id, command);
      if (command.children) visit(command.children);
    }
  };
  visit(commands);
  return map;
}
