import { createTypeAwareConfig } from "@reasonabletech/config-eslint";

export default [...createTypeAwareConfig(import.meta.dirname)];
