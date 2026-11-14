import { useState } from "react";
import { Combobox, type ComboboxOption } from "@forge-ui/combobox";

const countries: ComboboxOption[] = [
  { value: "ca", label: "Canada", group: "Americas", icon: "🇨🇦" },
  { value: "us", label: "United States", group: "Americas", icon: "🇺🇸" },
  { value: "br", label: "Brazil", group: "Americas", icon: "🇧🇷" },
  { value: "de", label: "Germany", group: "Europe", icon: "🇩🇪" },
  { value: "fr", label: "France", group: "Europe", icon: "🇫🇷", description: "Metropolitan France" },
  { value: "se", label: "Sweden", group: "Europe", icon: "🇸🇪" },
  { value: "jp", label: "Japan", group: "Asia", icon: "🇯🇵" },
  {
    value: "kp",
    label: "North Korea",
    group: "Asia",
    icon: "🇰🇵",
    disabled: true,
    description: "Not available",
  },
];

export default function ComboboxBasic() {
  const [country, setCountry] = useState<string | null>("de");
  return (
    <div className="max-w-sm space-y-2">
      <span id="country-label" className="block text-sm font-medium">
        Country
      </span>
      <Combobox
        aria-labelledby="country-label"
        placeholder="Search countries…"
        options={countries}
        value={country}
        onValueChange={setCountry}
        clearable
        name="country"
      />
      <p className="text-sm text-forge-muted">Selected value: {country ?? "none"}</p>
    </div>
  );
}
