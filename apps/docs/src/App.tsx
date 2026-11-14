import { useEffect, useRef } from "react";
import { Notifications } from "./notifications-host";
import { Layout } from "./components/layout";
import { ComponentPage } from "./components/component-page";
import {
  AccessibilityGuide,
  GettingStarted,
  Home,
  MarkdownPage,
  NotFound,
  Theming,
} from "./components/pages";
import { componentDocs } from "./docs";
import { pages } from "./docs/pages";
import { useRoute } from "./lib/router";
import { useTheme } from "./lib/theme";
import changelog from "../../../CHANGELOG.md?raw";
import contributing from "../../../CONTRIBUTING.md?raw";

function renderPage(path: string) {
  if (path === "/") return <Home />;
  if (path === "/guides/getting-started") return <GettingStarted />;
  if (path === "/guides/theming") return <Theming />;
  if (path === "/guides/accessibility") return <AccessibilityGuide />;
  if (path === "/contributing") return <MarkdownPage title="Contributing" source={contributing} />;
  if (path === "/changelog") return <MarkdownPage title="Changelog" source={changelog} />;
  const doc = componentDocs.find((entry) => path === `/components/${entry.slug}`);
  return doc ? <ComponentPage doc={doc} /> : <NotFound />;
}

export function App() {
  const { path, section } = useRoute();
  const { dark, toggle } = useTheme();
  const initialLoad = useRef(true);

  // On navigation: update the title, scroll, and move focus so keyboard and screen reader users land on the new page.
  useEffect(() => {
    const entry = pages.find((page) => page.path === path);
    document.title =
      entry && path !== "/"
        ? `${entry.title} · Forge UI`
        : "Forge UI · Accessible components for React";
    // The first load keeps the browser's natural focus start (so the skip link is the first Tab stop).
    // Only later, in-app navigations move focus to the new page.
    const moveFocus = !initialLoad.current;
    initialLoad.current = false;
    const frame = requestAnimationFrame(() => {
      const target = section ? document.getElementById(section) : null;
      if (target) {
        target.scrollIntoView({ block: "start" });
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        if (moveFocus) target.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0 });
        if (moveFocus)
          document.querySelector<HTMLElement>("[data-page-title]")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [path, section]);

  return (
    <Layout route={path} dark={dark} onToggleTheme={toggle}>
      {renderPage(path)}
      <Notifications />
    </Layout>
  );
}
