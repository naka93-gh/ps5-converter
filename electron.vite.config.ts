import { resolve } from "node:path";
import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "electron-vite";

// main/preload/rendererのどこからでも同じ型と共通処理を参照する
const sharedAlias = { "@shared": resolve("src/shared") };

export default defineConfig({
  main: {
    resolve: { alias: sharedAlias },
  },
  preload: {
    resolve: { alias: sharedAlias },
  },
  renderer: {
    root: resolve("src/renderer"),
    plugins: [
      angular({
        tsconfig: resolve("src/renderer/tsconfig.app.json"),
        workspaceRoot: resolve("."),
      }),
    ],
    resolve: {
      mainFields: ["module"],
      alias: sharedAlias,
    },
  },
});
