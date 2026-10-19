import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "db/migrations/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    rules: {
      // Security rules. See docs/security.md for the reasoning.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "Rendering raw HTML is banned. Render data as text or use a vetted sanitizer in one audited component.",
        },
        {
          selector:
            "CallExpression[callee.object.name='sql'][callee.property.name='raw']",
          message:
            "sql.raw bypasses parameter binding. Use the sql`` template tag with bound values or the query builder.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);

export default eslintConfig;
