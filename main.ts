import { toFrames } from "./frames.ts";

type ObjectLiteral = { [key: string]: unknown };

type AwaitedResult<T> = { -readonly [P in keyof T]: Awaited<T[P]> };
type PromiseResult<T> = Promise<AwaitedResult<T>>;

/**
 * Just a wrapper over Promise.all()
 */
export const concurrent = async <T extends readonly unknown[] | []>(
  ...values: T
): PromiseResult<T> => await Promise.all(values);

type AwaitedObjectLiteral<T extends ObjectLiteral> = {
  -readonly [P in keyof T]: Awaited<T[P]>;
};
type PromiseObjectLiteral<T extends ObjectLiteral> = Promise<
  AwaitedObjectLiteral<T>
>;

/**
 * Similar to Promise.all() but allows to pass object literals instead.
 */
export const concurrentLiteral = async <T extends ObjectLiteral>(
  values: T,
): PromiseObjectLiteral<T> => {
  const promises: Promise<[keyof T, unknown]>[] = [];
  for (const key in values) {
    promises.push((async () => [key, await values[key]])());
  }
  const results = await Promise.all(promises);
  return results.reduce((result, [key, value]) => {
    result[key] = value as Awaited<T[keyof T]>;
    return result;
  }, {} as AwaitedObjectLiteral<T>);
};

type LazySequence = readonly (() => unknown)[] | [];
type AwaitedLazySequence<T extends LazySequence> = {
  -readonly [P in keyof T]: Awaited<ReturnType<T[P]>>;
};
type PromiseLazySequence<T extends LazySequence> = Promise<
  AwaitedLazySequence<T>
>;

/**
 * Each async function is called sequentially, after the previous one is resolved.
 */
export const sequential = async <T extends LazySequence>(
  ...values: T
): PromiseLazySequence<T> => {
  const results = new Array(values.length).fill(undefined);
  for (let i = 0; i < results.length; ++i) results[i] = await values[i]();
  return results as AwaitedLazySequence<T>;
};

type LazyObjectLiteral = {
  [key: string]: () => unknown;
};
type AwaitedLazyObjectLiteral<T extends LazyObjectLiteral> = {
  -readonly [P in keyof T]: Awaited<ReturnType<T[P]>>;
};
type PromiseLazyObjectLiteral<T extends LazyObjectLiteral> = Promise<
  AwaitedLazyObjectLiteral<T>
>;

/**
 * Each async function from within this object is called sequentially, after the previous one is resolved.
 * The order is guaranteed as per the `for (const key in values)` loop.
 */
export const sequentialLiteral = async <T extends LazyObjectLiteral>(
  values: T,
): PromiseLazyObjectLiteral<T> => {
  const results = {} as AwaitedLazyObjectLiteral<T>;
  for (const key in values) {
    results[key] = (await values[key]()) as Awaited<
      ReturnType<T[Extract<keyof T, string>]>
    >;
  }
  return results;
};

/**
 * Chunks the array into smaller fixed length arrays and executes:
 *
 * ```ts
 * sequential(
 *    () => concurrent(frame1),
 *    () => concurrent(frame2),
 *    // ...
 *    () => concurrent(frameN),
 * );
 * ```
 */
export const concurrentChunked = async <
  T extends LazySequence,
  I extends number,
>(
  chunkSize: I,
  ...values: T
): PromiseLazySequence<T> => {
  const chunks = toFrames(values as (() => unknown)[], chunkSize, {
    keepTrailing: true,
  });
  const results = await sequential(
    ...chunks.map((chunk) => () => concurrent(...chunk.map((x) => x()))),
  );
  return results.flat() as AwaitedLazySequence<T>;
};
