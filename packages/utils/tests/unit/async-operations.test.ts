import { describe, expect, it, vi } from "vitest";

import { pipeAsync, runSequentially } from "../../src/async.js";

describe("async operations", () => {
  describe("pipeAsync", () => {
    describe("Core use cases", () => {
      it("should apply transforms sequentially", async () => {
        const executionOrder: string[] = [];

        const result = await pipeAsync(2, [
          (value): number => {
            executionOrder.push("double");
            return value * 2;
          },
          (value): number => {
            executionOrder.push("add-three");
            return value + 3;
          },
        ]);

        expect(result).toBe(7);
        expect(executionOrder).toEqual(["double", "add-three"]);
      });

      it("should return the initial value when no transforms are provided", async () => {
        const result = await pipeAsync("initial", []);
        expect(result).toBe("initial");
      });
    });

    describe("Error handling", () => {
      it("should stop on rejection and bubble the error", async () => {
        const finalTransform = vi.fn((value: number): number => value + 10);

        await expect(
          pipeAsync(1, [
            (value): number => value + 1,
            (): never => {
              throw new Error("pipeline failure");
            },
            finalTransform,
          ]),
        ).rejects.toThrow("pipeline failure");

        expect(finalTransform).not.toHaveBeenCalled();
      });
    });
  });

  describe("runSequentially", () => {
    describe("Core use cases", () => {
      it("should execute functions in order and collect results", async () => {
        const executionOrder: string[] = [];

        const results = await runSequentially([
          (): number => {
            executionOrder.push("first");
            return 1;
          },
          (): number => {
            executionOrder.push("second");
            return 2;
          },
          (): number => {
            executionOrder.push("third");
            return 3;
          },
        ]);

        expect(results).toEqual([1, 2, 3]);
        expect(executionOrder).toEqual(["first", "second", "third"]);
      });

      it("should return an empty array when no functions are provided", async () => {
        const results = await runSequentially<number>([]);
        expect(results).toEqual([]);
      });
    });

    describe("Error handling", () => {
      it("should stop execution when a function throws", async () => {
        const thirdFunction = vi.fn((): number => 3);

        await expect(
          runSequentially([
            (): number => 1,
            (): never => {
              throw new Error("sequential failure");
            },
            thirdFunction,
          ]),
        ).rejects.toThrow("sequential failure");

        expect(thirdFunction).not.toHaveBeenCalled();
      });
    });
  });
});
