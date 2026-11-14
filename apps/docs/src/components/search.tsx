import { useMemo } from "react";
import { CommandPalette, type Command } from "@forge-ui/command-palette";
import { componentDocs } from "../docs";
import { pages } from "../docs/pages";
import { navigate } from "../lib/router";

/** Site search is the Forge UI command palette, so the docs use what they document. */
export function SearchPalette({
  open,
  onOpenChange,
  dark,
  onToggleTheme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const commands = useMemo<Command[]>(() => {
    const pageCommands = pages.map<Command>((page) => ({
      id: `page:${page.path}`,
      label: page.title,
      description: page.description,
      group: page.group === "Components" ? "Components" : "Pages",
      keywords: page.keywords,
      icon: page.group === "Components" ? "◧" : "▤",
      onSelect: () => navigate(page.path),
    }));

    const sections = componentDocs.flatMap((doc) => [
      ...doc.examples.map<Command>((example) => ({
        id: `example:${doc.slug}:${example.id}`,
        label: `${doc.name}: ${example.title}`,
        description: "Example",
        group: "Examples",
        keywords: [doc.slug, ...doc.keywords],
        icon: "▶",
        onSelect: () => navigate(`/components/${doc.slug}`, example.id),
      })),
      ...(["api", "keyboard", "accessibility"] as const).map<Command>((section) => ({
        id: `section:${doc.slug}:${section}`,
        label: `${doc.name}: ${section === "api" ? "API reference" : section === "keyboard" ? "Keyboard" : "Accessibility"}`,
        group: "Sections",
        keywords: [doc.slug, section, ...doc.keywords],
        icon: "§",
        onSelect: () => navigate(`/components/${doc.slug}`, section),
      })),
    ]);

    return [
      ...pageCommands,
      ...sections,
      {
        id: "action:theme",
        label: dark ? "Switch to light theme" : "Switch to dark theme",
        group: "Actions",
        icon: "◐",
        keywords: ["dark mode", "light mode", "appearance"],
        onSelect: onToggleTheme,
      },
    ];
  }, [dark, onToggleTheme]);

  return (
    <CommandPalette
      commands={commands}
      open={open}
      onOpenChange={onOpenChange}
      label="Search documentation"
      placeholder="Search components, examples, and guides…"
      emptyMessage="Nothing matches. Try a component name or a topic like “keyboard”."
      recent={{ storageKey: "forge-docs-recent", limit: 4 }}
    />
  );
}
