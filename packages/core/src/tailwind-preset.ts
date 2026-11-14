/**
 * Optional Tailwind preset that exposes the Forge UI tokens as theme colors,
 * so app code can write `bg-forge-surface` or `text-forge-muted`.
 */
const token = (name: string) => `var(--forge-${name})`;

const preset = {
  theme: {
    extend: {
      colors: {
        forge: {
          bg: token("bg"),
          surface: token("surface"),
          "surface-hover": token("surface-hover"),
          border: token("border"),
          text: token("text"),
          muted: token("text-muted"),
          accent: token("accent"),
          "accent-text": token("accent-text"),
          danger: token("danger"),
          success: token("success"),
          warning: token("warning"),
          info: token("info"),
        },
      },
      borderRadius: { forge: token("radius") },
    },
  },
};

export default preset;
