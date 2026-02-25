/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce specific scopes for this monorepo
    "scope-enum": [
      2,
      "always",
      [
        "config-typescript",
        "config-tsup",
        "config-vitest",
        "config-eslint",
        "config-playwright",
        "utils",
        "repo",
      ],
    ],
    // Allow empty scope for general changes
    "scope-empty": [0],
  },
};
