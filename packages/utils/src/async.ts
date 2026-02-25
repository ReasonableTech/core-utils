/**
 * Async utility functions for the `@reasonabletech` platform
 */

/**
 * Execute an array of async transform functions sequentially, piping the result
 * of each function to the next.
 *
 * This is useful for patterns like request/response interceptors where each
 * function must transform the result of the previous one in order.
 * @param initial - The initial value to pass to the first function
 * @param fns - Array of async transform functions to execute in order
 * @returns Promise resolving to the final transformed value
 * @example
 * ```typescript
 * // Request interceptor pipeline
 * const finalConfig = await pipeAsync(initialConfig, [
 *   async (config) => ({ ...config, headers: { ...config.headers, 'X-Request-Id': id } }),
 *   async (config) => ({ ...config, timestamp: Date.now() }),
 * ]);
 *
 * // Response interceptor pipeline
 * const finalResponse = await pipeAsync(response, responseInterceptors);
 * ```
 */
export async function pipeAsync<T>(
  initial: T,
  fns: ReadonlyArray<(value: T) => T | Promise<T>>,
): Promise<T> {
  // Use reduce with promise chaining to avoid eslint no-await-in-loop
  return await fns.reduce<Promise<T>>(
    async (promise, fn) => await promise.then(fn),
    Promise.resolve(initial),
  );
}

/**
 * Execute an array of async functions sequentially, collecting all results.
 *
 * Unlike Promise.all which runs in parallel, this ensures each function
 * completes before the next one starts.
 * @param fns - Array of async functions to execute in order
 * @returns Promise resolving to array of results in the same order
 * @example
 * ```typescript
 * const results = await runSequentially([
 *   () => fetchUser(1),
 *   () => fetchUser(2),
 *   () => fetchUser(3),
 * ]);
 * ```
 */
export async function runSequentially<T>(
  fns: ReadonlyArray<() => T | Promise<T>>,
): Promise<T[]> {
  const results: T[] = [];

  // Use reduce with promise chaining to avoid eslint no-await-in-loop
  await fns.reduce<Promise<void>>(
    async (promise, fn) =>
      { await promise.then(async () => {
        const result = await fn();
        results.push(result);
      }); },
    Promise.resolve(),
  );

  return results;
}
