import { defineConfig } from "eslint/config";
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default defineConfig(...createTypeAwareConfig(import.meta.dirname));
