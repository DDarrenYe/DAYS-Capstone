import ultracite from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    extends: [core, next, react, shadcn, tanstack, antiSlop],
    ignorePatterns: [...(core.ignorePatterns ?? []), "design/**"],
    jsPlugins: shadcn.jsPlugins,
    overrides: [
      {
        files: ["**/components/ui/**"],
        rules: {
          "func-style": "off",
          "react/function-component-definition": "off",
        },
      },
    ],
  },
  fmt: {
    ...ultracite,
    ignorePatterns: [...(ultracite.ignorePatterns ?? []), "design/**"],
  },
});
