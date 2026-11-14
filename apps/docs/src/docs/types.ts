import type { ComponentType } from "react";

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ApiSection {
  title: string;
  description?: string;
  rows: PropRow[];
}

export interface ExampleDef {
  id: string;
  title: string;
  description: string;
  /** The running component. Omit for code-only examples. */
  Component?: ComponentType;
  /** Source shown to readers. Import it with `?raw` so it is exactly what runs. */
  code: string;
}

export interface KeyRow {
  keys: string;
  action: string;
}

export interface ComponentDoc {
  slug: string;
  name: string;
  /** Package name without the scope, for example `data-table`. */
  pkg: string;
  summary: string;
  keywords: string[];
  whenToUse: string[];
  /** Other npm packages this one is commonly used with. */
  alsoInstall?: string[];
  /** Other Forge UI packages whose stylesheet this one needs. */
  extraStyles?: string[];
  usage: string;
  examples: ExampleDef[];
  api: ApiSection[];
  keyboard: KeyRow[];
  accessibility: string[];
  customization: string[];
  mistakes: string[];
}
