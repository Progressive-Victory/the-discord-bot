import pluginJs from "@eslint/js";
import parserTs from "@typescript-eslint/parser";
import tsdoc from 'eslint-plugin-tsdoc';
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'warn',
    }
  },
  {
    languageOptions: {
      globals: globals.node,
      parser: parserTs,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
    eslintConfigPrettier,
);
