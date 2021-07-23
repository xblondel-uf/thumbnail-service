/**
 * Utilities used in tests.
 */

/**
 * Sleep for a given number of milliseconds.
 *
 * @param ms - Time to sleep for
 * @returns Nothing
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true, or for a given timeout.
 * Throws if the timeout expires.
 *
 * @param timeout - Maximum time to wait
 * @param condition - Condition to check
 * @returns Nothing
 */
export async function waitFor(
  timeout: number,
  condition: { (): boolean }
): Promise<void> {
  let total = 0;
  const quantum = 10;
  let checked = condition();
  while (!checked && total < timeout) {
    await sleep(quantum);
    total += quantum;
    checked = condition();
  }
  if (!checked) {
    throw new Error('Timeout in waitFor');
  }
}
