import { vi, type Mock } from "vitest";

export const createNextjsConfigs: Mock<(...args: unknown[]) => unknown> = vi.fn();
