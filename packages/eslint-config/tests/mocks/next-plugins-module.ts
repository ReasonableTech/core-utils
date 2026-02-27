import { vi, type Mock } from "vitest";

export const createNextjsPluginConfig: Mock<(...args: unknown[]) => unknown> = vi.fn();
