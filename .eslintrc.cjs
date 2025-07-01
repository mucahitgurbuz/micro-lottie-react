module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    // TypeScript
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",

    // React
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript for prop validation
    "react/display-name": "off",

    // General
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-undef": "off", // TypeScript handles this
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "*.js",
    "*.mjs",
    "*.cjs",
    "benchmarks/",
    "examples/",
  ],
};
