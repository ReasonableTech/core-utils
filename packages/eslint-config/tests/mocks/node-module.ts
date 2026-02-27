export const createNodeModuleMock = (
  requireFromBase: (moduleId: string) => unknown,
): {
  createRequire: () => (moduleId: string) => unknown;
} => ({
  createRequire: () => requireFromBase,
});
