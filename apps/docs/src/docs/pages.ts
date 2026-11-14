import { componentDocs } from "./index";

export interface PageEntry {
  path: string;
  title: string;
  group: "Start" | "Components" | "Project";
  description: string;
  keywords?: string[];
}

export const pages: PageEntry[] = [
  {
    path: "/",
    title: "Introduction",
    group: "Start",
    description: "What Forge UI is and why it exists",
    keywords: ["home", "overview"],
  },
  {
    path: "/guides/getting-started",
    title: "Getting started",
    group: "Start",
    description: "Install, import styles, and render your first component",
    keywords: ["install", "setup", "quick start"],
  },
  {
    path: "/guides/theming",
    title: "Theming",
    group: "Start",
    description: "Design tokens, dark mode, and the Tailwind preset",
    keywords: ["css variables", "dark mode", "tokens", "tailwind"],
  },
  {
    path: "/guides/accessibility",
    title: "Accessibility",
    group: "Start",
    description: "How Forge UI approaches keyboard and screen reader support",
    keywords: ["a11y", "aria", "keyboard", "screen reader"],
  },
  ...componentDocs.map<PageEntry>((doc) => ({
    path: `/components/${doc.slug}`,
    title: doc.name,
    group: "Components",
    description: doc.summary.split(". ")[0] ?? doc.summary,
    keywords: doc.keywords,
  })),
  {
    path: "/contributing",
    title: "Contributing",
    group: "Project",
    description: "Set up the repo, run checks, and open a pull request",
    keywords: ["development", "pull request", "setup"],
  },
  {
    path: "/changelog",
    title: "Changelog",
    group: "Project",
    description: "Release notes",
    keywords: ["releases", "versions"],
  },
];

export const GITHUB_URL = "https://github.com/bzdevelopments/forge-ui";
export const ORG_URL = "https://github.com/bzdevelopments";
