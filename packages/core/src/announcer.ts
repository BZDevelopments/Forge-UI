export type AnnouncePoliteness = "polite" | "assertive";

const REGION_ATTR = "data-forge-announcer";

function getRegion(politeness: AnnouncePoliteness): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let region = document.querySelector<HTMLElement>(`[${REGION_ATTR}="${politeness}"]`);
  if (!region) {
    region = document.createElement("div");
    region.setAttribute(REGION_ATTR, politeness);
    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
    region.className = "forge-sr-only";
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Sends a message to a shared, visually hidden live region.
 * The text is cleared and re-set on the next frame so repeated messages are still announced.
 */
export function announce(message: string, politeness: AnnouncePoliteness = "polite"): void {
  const region = getRegion(politeness);
  if (!region) return;
  region.textContent = "";
  const write = () => {
    region.textContent = message;
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(write);
  else write();
}
