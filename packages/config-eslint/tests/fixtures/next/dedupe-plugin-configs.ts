import type { Linter } from "eslint";

export const createDedupeBaseConfigs = (): Linter.Config[] => {
  const pluginWithConfigs = {
    meta: { name: "react" },
    configs: { recommended: {} },
  };

  return [
    {
      plugins: {
        react: pluginWithConfigs,
      },
    },
    {
      rules: {
        semi: "error",
      },
      plugins: {
        react: pluginWithConfigs,
      },
    },
    {
      rules: {
        eqeqeq: "error",
      },
    },
  ];
};
