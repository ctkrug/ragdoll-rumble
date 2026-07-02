import { defineConfig } from "vite";

// base: "./" keeps every emitted asset path relative so the build can be
// hosted from any subpath (e.g. apps.charliekrug.com/ragdoll-rumble).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
