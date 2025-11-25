// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import unicornPlugin from "eslint-plugin-unicorn";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import prettierPlugin from "eslint-plugin-prettier";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["build/**", "dist/**", "public/**", "*.mjs", "*.json"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      ts: tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      jsxA11y: jsxA11yPlugin,
      unicorn: unicornPlugin,
      sonarjs: sonarjsPlugin,
      perfectionist: perfectionistPlugin,
      tailwindcss: tailwindcssPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "unicorn/no-unused-properties": "error",

      // SonarJS
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "warn",

      // Perfectionist
      "perfectionist/sort-imports": "error",
      "perfectionist/sort-objects": "error",
      "perfectionist/sort-array-includes": "error",

      // React
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-curly-brace-presence": ["error", "never"],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General
      "no-param-reassign": "error",
      "indent": ["error", 2, { "SwitchCase": 1 }],
      eqeqeq: ["error", "always"]
    },
    settings: {
      react: { version: "detect" },
      tailwindcss: { callees: ["cn", "clsx"], config: "tailwind.config.js" }
    }
  }
];
