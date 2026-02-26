/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "subject-capitalize": (parsed) => {
          const { subject } = parsed;
          if (!subject) return [true];
          const first = subject.trimStart()[0];
          if (!first || !/[a-zA-Z]/u.test(first)) return [true];
          return [
            first === first.toUpperCase(),
            "subject must start with a capital letter",
          ];
        },
      },
    },
  ],
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
      ],
    ],
    // Allow empty scope for general changes
    "scope-empty": [0],
    // config-conventional bans sentence-case; override so capital subjects are valid
    "subject-case": [0],
    // Require subject to start with a capital letter
    "subject-capitalize": [2, "always"],
  },
};
