import { type Options } from "tsup";
import type { BuildOptions } from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";

// Local utility to avoid circular dependency with @reasonabletech/utils
function includeIfDefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function resolveDefaultBuildTsconfigPath(): string | undefined {
  const buildTsconfigFileName = "tsconfig.build.json";
  const packageJsonPath = process.env.npm_package_json;

  if (packageJsonPath !== undefined) {
    const packageDir = path.dirname(packageJsonPath);
    const packageTsconfigPath = path.join(packageDir, buildTsconfigFileName);
    if (existsSync(packageTsconfigPath)) {
      return packageDir === process.cwd()
        ? buildTsconfigFileName
        : packageTsconfigPath;
    }
  }

  const cwdTsconfigPath = path.join(process.cwd(), buildTsconfigFileName);
  if (existsSync(cwdTsconfigPath)) {
    return buildTsconfigFileName;
  }

  return undefined;
}

/**
 * Function signature for customizing tsup's `esbuildOptions`.
 */
export type EsbuildOptionsFunction = (
  options: Readonly<BuildOptions>,
) => BuildOptions;

/**
 * Configuration options for creating a tsup build configuration.
 */
export interface TsupConfigOptions {
  /**
   * Entry points for the build. Can be a string, array, or object.
   * Defaults to { index: "src/index.ts" }
   */
  readonly entry?:
    | Readonly<Record<string, string>>
    | string
    | readonly string[];

  /**
   * Output formats. Defaults to ["esm"].
   * ESM is the standard - other formats are strongly discouraged except with compelling justification.
   */
  readonly format?: ReadonlyArray<"esm" | "cjs" | "iife">;

  /**
   * External dependencies that should not be bundled.
   * If not provided, sensible defaults are used based on platform.
   * To override defaults completely, use noExternal: [/.*\/] and provide exact externals.
   */
  readonly external?: readonly string[];

  /**
   * Dependencies that should always be bundled (opposite of external).
   * Use [/.*\/] to bundle everything except what's in external array.
   */
  readonly noExternal?: ReadonlyArray<string | RegExp>;

  /**
   * Whether to generate TypeScript declaration files. Defaults to false.
   */
  readonly dts?: boolean;

  /**
   * Whether to generate source maps. Defaults to true.
   */
  readonly sourcemap?: boolean;

  /**
   * Whether to bundle dependencies. Defaults to true.
   */
  readonly bundle?: boolean;

  /**
   * Whether to clean the output directory before building. Defaults to false.
   *
   * Rationale: A non-clean default avoids deleting artifacts unexpectedly in
   * multi-step builds and keeps incremental local workflows predictable.
   * Packages that need cleaning can explicitly set clean=true.
   */
  readonly clean?: boolean;

  /**
   * Whether to enable tree shaking. Defaults to true.
   */
  readonly treeshake?: boolean;

  /**
   * Whether to enable code splitting. Defaults to false for better compatibility.
   */
  readonly splitting?: boolean;

  /**
   * Target platform. Defaults to "neutral" for libraries.
   */
  readonly platform?: "node" | "browser" | "neutral";

  /**
   * Target environment. Defaults to "ES2023" (Node.js 22 compatible).
   */
  readonly target?: string;

  /**
   * Path to TypeScript config file.
   */
  readonly tsconfig?: string;

  /**
   * Additional esbuild plugins.
   */
  readonly esbuildPlugins?: readonly unknown[];

  /**
   * Custom esbuild options function.
   */
  readonly esbuildOptions?: (options: Readonly<BuildOptions>) => BuildOptions;

  /**
   * Build-time environment variable definitions.
   */
  readonly define?: Readonly<Record<string, string>>;

  /**
   * Custom onSuccess callback.
   */
  readonly onSuccess?: () => void | Promise<void>;

  /**
   * Minification options.
   */
  readonly minify?: boolean | "terser";

  /**
   * Terser-specific options (when minify: "terser").
   */
  readonly terserOptions?: {
    readonly compress?: Record<string, unknown>;
    readonly mangle?: Record<string, unknown>;
  };

  /**
   * Whether to generate metafile for bundle analysis.
   */
  readonly metafile?: boolean;
}

/**
 * Base tsup configuration for packages in the ReasonableTech project.
 *
 * This configuration provides sensible defaults for most packages while allowing
 * for customization through options or by extending this configuration.
 * @param options Configuration options to customize the tsup build
 * @returns Configured tsup build settings
 */
export function createTsupConfig(
  options: TsupConfigOptions = {},
): Options {
  const {
    entry = { index: "src/index.ts" },
    format = ["esm"],
    external,
    noExternal,
    dts = false,
    bundle,
    clean = false,
    sourcemap = true,
    treeshake = true,
    splitting = false,
    platform = "neutral",
    target = "ES2023",
    tsconfig,
    esbuildPlugins = [],
    esbuildOptions,
    define,
    onSuccess,
    minify,
    terserOptions,
    metafile,
  } = options;

  // Default externals - only used if user doesn't provide noExternal
  const defaultExternal = [
    // Peer dependencies
    "react",
    "react-dom",
    "next",
    "next/headers",
    "next/navigation",
    "next/server",
    "express",
    "electron",
    // Node.js built-ins
    "fs",
    "path",
    "os",
    "crypto",
    "child_process",
    "http",
    "https",
    "url",
    "events",
    "util",
    "stream",
    "buffer",
    "querystring",
  ];

  // Determine final external list
  let finalExternal: string[] | undefined;
  if (noExternal !== undefined) {
    // If noExternal is provided, only use the explicit external list
    finalExternal = external !== undefined ? [...external] : undefined;
  } else {
    // Default behavior: merge user external with defaults
    finalExternal =
      external !== undefined
        ? [...defaultExternal, ...external]
        : defaultExternal;
  }

  const resolvedTsconfig = tsconfig ?? resolveDefaultBuildTsconfigPath();

  const config: Options = {
    dts,
    splitting,
    sourcemap,
    clean,
    treeshake,
    platform,
    target,
    outExtension() {
      return { js: `.js` };
    },
    ...includeIfDefined({
      entry: entry as Options["entry"],
      format: format as Options["format"],
      external: finalExternal as Options["external"],
      noExternal: noExternal as Options["noExternal"],
      bundle,
      tsconfig: resolvedTsconfig,
      esbuildPlugins,
      esbuildOptions,
      define,
      onSuccess,
      minify,
      terserOptions,
      metafile,
    }),
  };
  //   ...(tsconfig !== undefined ? { tsconfig } : {}),
  //   ...(esbuildPlugins.length > 0
  //     ? { esbuildPlugins: esbuildPlugins as Options["esbuildPlugins"] }
  //     : {}),
  //   ...(esbuildOptions !== undefined
  //     ? { esbuildOptions: esbuildOptions as Options["esbuildOptions"] }
  //     : {}),
  //   ...(define !== undefined ? { define: define as Options["define"] } : {}),
  //   ...(onSuccess !== undefined
  //     ? { onSuccess: onSuccess as Options["onSuccess"] }
  //     : {}),
  // };

  return config;
}

/**
 * Pre-configured tsup config for build/config packages.
 */
export const configPackageConfig = createTsupConfig({
  external: ["tsup", "esbuild"],
});

/**
 * Pre-configured tsup config for React component libraries.
 */
export const reactConfig = createTsupConfig({
  external: ["@mui/icons-material"],

  esbuildOptions(options: Readonly<BuildOptions>) {
    return {
      ...options,
      jsx: "automatic",
    };
  },
});

/**
 * Pre-configured tsup config for Node.js applications/CLIs.
 */
export const nodeConfig = createTsupConfig({
  platform: "node",
  external: ["dotenv"],
});
