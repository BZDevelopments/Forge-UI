import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  cn,
  fuzzyMatch,
  matchesShortcut,
  parseShortcut,
  resolveLocale,
  Spinner,
  useControllableState,
} from "../src";

describe("cn", () => {
  it("joins truthy values and flattens arrays", () => {
    expect(cn("a", false, null, undefined, ["b", ["c"]], 0)).toBe("a b c 0");
  });
});

describe("useControllableState", () => {
  it("updates internally when uncontrolled and reports changes", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 1, onChange }),
    );
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not change on its own when controlled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: 5, defaultValue: 0, onChange }),
    );
    act(() => result.current[1](9));
    expect(result.current[0]).toBe(5);
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it("skips onChange when the value is unchanged", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: "a", onChange }),
    );
    act(() => result.current[1]("a"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("fuzzyMatch", () => {
  it("matches subsequences and returns indices", () => {
    const match = fuzzyMatch("gtd", "Go to dashboard");
    expect(match).not.toBeNull();
    expect(match!.indices).toHaveLength(3);
  });

  it("returns null when characters are missing", () => {
    expect(fuzzyMatch("xyz", "dashboard")).toBeNull();
  });

  it("ranks prefix matches above scattered ones", () => {
    const prefix = fuzzyMatch("set", "Settings")!;
    const scattered = fuzzyMatch("set", "Open the secret tool")!;
    expect(prefix.score).toBeGreaterThan(scattered.score);
  });

  it("matches each word of the query on its own, in any order", () => {
    const match = fuzzyMatch("table server", "Data table: Server-side data");
    expect(match).not.toBeNull();
    expect(match!.indices).toEqual([...new Set(match!.indices)].sort((a, b) => a - b));
    expect(fuzzyMatch("server side", "Server-side data")).not.toBeNull();
    expect(fuzzyMatch("server zzz", "Server-side data")).toBeNull();
  });

  it("matches everything for an empty query", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, indices: [] });
  });
});

describe("shortcuts", () => {
  it("parses modifiers and the key", () => {
    expect(parseShortcut("mod+shift+K")).toMatchObject({ key: "k", mod: true, shift: true });
  });

  it("matches ctrl+k on non-Apple platforms", () => {
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    expect(matchesShortcut(event, parseShortcut("ctrl+k"))).toBe(true);
    expect(matchesShortcut(event, parseShortcut("ctrl+j"))).toBe(false);
  });
});

describe("Button", () => {
  it("is disabled and busy while loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <div>
        <Button>Save</Button>
        <Spinner />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("resolveLocale", () => {
  const original = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const languages = Object.getOwnPropertyDescriptor(window.navigator, "languages");
  const setBrowser = (language: string, list: string[] = [language]) => {
    Object.defineProperty(window.navigator, "language", { configurable: true, value: language });
    Object.defineProperty(window.navigator, "languages", { configurable: true, value: list });
  };
  afterEach(() => {
    if (original) Object.defineProperty(window.navigator, "language", original);
    if (languages) Object.defineProperty(window.navigator, "languages", languages);
  });

  it("returns a valid requested locale unchanged", () => {
    expect(resolveLocale("de-DE")).toBe("de-DE");
  });

  it("repairs POSIX-style tags that Intl rejects", () => {
    expect(resolveLocale("en_US.UTF-8")).toBe("en-US");
    expect(resolveLocale("fr-FR@euro")).toBe("fr-FR");
  });

  it("falls back to the browser language, then to en-US, instead of throwing", () => {
    setBrowser("en-US@posix");
    expect(() => new Intl.DateTimeFormat(resolveLocale())).not.toThrow();
    expect(resolveLocale("not a locale")).toBe("en-US");
    setBrowser("zz-garbage-tag", ["zz-garbage-tag"]);
    expect(resolveLocale()).toBe("en-US");
  });
});
