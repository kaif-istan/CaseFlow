import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // 🔥 Custom rule overrides (Option 1)
  {
    rules: {
      // ------- TypeScript Strictness -------
      "@typescript-eslint/no-explicit-any": "off",      // do not block build/CI
      "@typescript-eslint/no-unused-vars": "warn",      // allow unused vars, warn only
      "prefer-const": "warn",                           // common harmless rule

      // ------- React Rules -------
      "react/no-unescaped-entities": "warn",            // JSX quotes
      "react-hooks/exhaustive-deps": "warn",            // dependency array warnings only
      "react-hooks/rules-of-hooks": "error",            // still required
      "react-hooks/purity": "off",                      // disable purity warnings (for now)

      // ------- General Code Style -------
      "no-console": "off",

      // ------- Next.js Rules -------
      "@next/next/no-img-element": "off",
    },
  },
]);
