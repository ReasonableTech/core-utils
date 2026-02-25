import type { TestEnvironmentConfig } from "../../src/index.js";

export const crossAppTestEnvironments: Readonly<
  Record<string, TestEnvironmentConfig>
> = {
  development: {
    baseUrls: {
      landing: "http://localhost:3000",
      accounts: "http://localhost:3001",
      app: "http://localhost:3002",
    },
    services: {
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },
  staging: {
    baseUrls: {
      landing: "https://staging.reasonabletech.io",
      accounts: "https://accounts-staging.reasonabletech.io",
    },
    services: {
      useRealServices: true,
      mockExternalAPIs: false,
    },
  },
};

export const emptyBaseUrlEnvironment: Readonly<
  Record<string, TestEnvironmentConfig>
> = {
  development: {
    baseUrls: {},
    services: {
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },
};
