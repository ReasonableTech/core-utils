export const createRequireFromBaseMock = (
  moduleMap: Record<string, unknown>,
): ((moduleId: string) => unknown) =>
  (moduleId: string): unknown => {
    if (Object.prototype.hasOwnProperty.call(moduleMap, moduleId)) {
      return moduleMap[moduleId];
    }
    throw new Error(`Unexpected module: ${moduleId}`);
  };
