import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import unicornPlugin from "eslint-plugin-unicorn";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/build/**",
      "**/dist/**",
      "**/public/**",
      "*.mjs",
      "*.json"
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
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
      ...prettierConfig.rules,
      "prettier/prettier": "error",

      "unicorn/no-for-loop": "error",
      "unicorn/no-useless-undefined": "error",

      // SonarJS
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "warn",

      // Perfectionist
      "perfectionist/sort-objects": "error",
      "perfectionist/sort-array-includes": "error",

      // React
      "react/jsx-boolean-value": ["error", "always"],
      "react/jsx-sort-props": ["error", { shorthandFirst: true, callbacksLast: true }],
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-curly-brace-presence": ["error", "never"],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General
      "no-console": "warn",
      "no-debugger": "error",
      "ts/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "no-shadow": "error",
      "prefer-const": "error",
      "arrow-body-style": ["error", "as-needed"],
      "no-param-reassign": "error",
      eqeqeq: ["error", "always"],

      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
    settings: {
      react: { version: "detect" },
      tailwindcss: { callees: ["cn", "clsx"], config: "tailwind.config.js" },
    },
  },
];