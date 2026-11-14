import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No aliases on purpose: this app resolves Forge UI through each package's `exports`, like any consumer.
export default defineConfig({ plugins: [react()] });
