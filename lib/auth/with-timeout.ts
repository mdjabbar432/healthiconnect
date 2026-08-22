/** Rejects `promise` if it does not settle within `ms`. Does not cancel the original work. */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message = "The request timed out. Please try again.",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const asPromise = Promise.resolve(promise);

  // Extra listener so a late rejection after timeout is not an unhandled rejection.
  asPromise.catch(() => {});

  return Promise.race([
    asPromise.finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}
