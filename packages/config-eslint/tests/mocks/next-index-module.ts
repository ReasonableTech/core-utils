import { vi, type Mock } from "vitest";

export const createTypeAwareConfig: Mock<(...args: unknown[]) => unknown> = vi.fn();
