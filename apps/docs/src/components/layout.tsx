import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatShortcut } from "@forge-ui/core";
import { Link } from "../lib/router";
import { GITHUB_URL, ORG_URL, pages } from "../docs/pages";
import { SearchPalette } from "./search";

const GROUPS = ["Start", "Components", "Project"] as const;

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={dark}
      className="grid h-9 w-9 place-items-center rounded-md border border-forge-border text-forge-muted hover:bg-forge-hover hover:text-forge-text"
    >
      <span aria-hidden="true">{dark ? "☾" : "☀"}</span>
      <span className="sr-only">Dark mode</span>
    </button>
  );
}

export function Layout({
  route,
  dark,
  onToggleTheme,
  children,
}: {
  route: string;
  dark: boolean;
  onToggleTheme: () => void;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-forge-border bg-forge-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-3 px-4">
          <button
            ref={menuButton}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-forge-border lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            <span className="sr-only">Menu</span>
          </button>
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-forge-accent text-sm font-bold text-[var(--forge-accent-text)]"
            >
              F
            </span>
            Forge UI
          </Link>
          <span className="rounded-full border border-forge-border px-2 py-0.5 text-xs text-forge-muted">
            v0.1
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 items-center gap-2 rounded-md border border-forge-border px-3 text-sm text-forge-muted hover:bg-forge-hover"
          >
            <span aria-hidden="true">⌕</span>
            <span className="hidden sm:inline">Search docs</span>
            <span className="sr-only sm:hidden">Search docs</span>
            <kbd className="hidden rounded border border-forge-border px-1.5 font-mono text-xs sm:inline">
              {formatShortcut("mod+k")}
            </kbd>
          </button>
          <a
            href={GITHUB_URL}
            className="hidden h-9 items-center rounded-md border border-forge-border px-3 text-sm hover:bg-forge-hover sm:flex"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[88rem] gap-8 px-4">
        <nav
          id="site-nav"
          aria-label="Documentation"
          className={`${menuOpen ? "block" : "hidden"} fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-forge-bg p-4 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:flex-none lg:bg-transparent lg:px-0 lg:py-6`}
        >
          {GROUPS.map((group) => (
            <div key={group} className="mb-6">
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
                {group}
              </h2>
              <ul className="space-y-0.5">
                {pages
                  .filter((page) => page.group === group)
                  .map((page) => {
                    const current = page.path === route;
                    return (
                      <li key={page.path}>
                        <Link
                          to={page.path}
                          aria-current={current ? "page" : undefined}
                          className={`block rounded-md px-2 py-1.5 text-sm ${current ? "bg-forge-accent-soft font-semibold text-forge-text" : "text-forge-muted hover:bg-forge-hover hover:text-forge-text"}`}
                        >
                          {page.title}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1 py-8">
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <footer className="mt-16 border-t border-forge-border pt-6 text-sm text-forge-muted">
            <p>
              Forge UI is open source under the MIT license. Created and maintained by{" "}
              <a
                href={ORG_URL}
                className="font-medium text-forge-text underline underline-offset-2"
                rel="noreferrer noopener"
              >
                BZDevelopments
              </a>
              .
            </p>
            <p className="mt-1">
              <a
                href={GITHUB_URL}
                className="underline underline-offset-2"
                rel="noreferrer noopener"
              >
                View the source
              </a>
              {" · "}
              <a
                href={`${GITHUB_URL}/issues`}
                className="underline underline-offset-2"
                rel="noreferrer noopener"
              >
                Report an issue
              </a>
              {" · "}
              <Link to="/contributing" className="underline underline-offset-2">
                Contribute
              </Link>
            </p>
          </footer>
        </div>
      </div>
      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        dark={dark}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}
