import { useEffect, useState, type AnchorHTMLAttributes } from "react";

/** Hash routing keeps the docs deployable on any static host with no rewrite rules. */
export interface Route {
  path: string;
  /** Optional element id to scroll to, from `#/path?section=id`. */
  section: string | null;
}

function parse(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  const [rawPath = "", query = ""] = hash.split("?");
  const path = rawPath.startsWith("/") ? rawPath : "/";
  return { path, section: new URLSearchParams(query).get("section") };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function hrefFor(path: string, section?: string): string {
  return `#${path}${section ? `?section=${encodeURIComponent(section)}` : ""}`;
}

export function navigate(path: string, section?: string) {
  window.location.hash = hrefFor(path, section).slice(1);
}

export function Link({
  to,
  section,
  ...props
}: { to: string; section?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  // eslint-disable-next-line jsx-a11y/anchor-has-content -- children arrive through props
  return <a href={hrefFor(to, section)} {...props} />;
}
