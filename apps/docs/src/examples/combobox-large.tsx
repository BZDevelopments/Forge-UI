import { useMemo } from "react";
import { Combobox } from "@forge-ui/combobox";

export default function ComboboxLarge() {
  // 20,000 options. Only the visible rows are rendered.
  const options = useMemo(
    () =>
      Array.from({ length: 20_000 }, (_, i) => ({
        value: `item-${i}`,
        label: `Inventory item ${i + 1}`,
        description: `SKU-${String(i + 1).padStart(5, "0")}`,
      })),
    [],
  );
  return (
    <div className="max-w-sm">
      <Combobox aria-label="Inventory item" placeholder="Search 20,000 items…" options={options} />
    </div>
  );
}
