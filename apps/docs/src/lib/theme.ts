import { useCallback, useEffect, useState } from "react";

const KEY = "forge-docs-theme";

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* private mode: the choice just will not persist */
    }
  }, [dark]);

  const toggle = useCallback(() => setDark((value) => !value), []);
  return { dark, toggle };
}
