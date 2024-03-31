import { assertEquals, assertArrayIncludes } from 'https://deno.land/std@0.215.0/assert/mod.ts';
import { concurrent, concurrentLiteral, sequential, sequentialLiteral, concurrentChunked } from './main.ts';
import { toFrames } from './frames.ts';

type Tracker = {
  createdAt: Date;
  evaluatedAt?: Date;
  finishedAt?: Date;
};

function trackedPromise(millis: number = 500) {
  const tracker: Tracker = { createdAt: new Date() };
  return new Promise<Tracker>((resolve) => {
    tracker.evaluatedAt = new Date();
    setTimeout(
      () => {
        tracker.finishedAt = new Date();
        resolve(tracker);
      },
      millis
    );
  });
}

Deno.test("concurrent", async () => {
  const results = await concurrent(
    trackedPromise(100),
    trackedPromise(100),
    trackedPromise(100),
  );

  assertEquals(results.length, 3);
});

Deno.test("concurrentLiteral", async () => {
  const results = await concurrentLiteral({
    a: trackedPromise(100),
    b: trackedPromise(100),
    c: trackedPromise(100),
  });

  const keys = Object.keys(results);
  const values = Object.values(results);
  assertEquals(keys.length, 3);
  assertArrayIncludes(keys, ["a", "b", "c"]);
  assertEquals(values.length, 3);
  assertEquals(values.every((result) => !!result), true);
});

Deno.test("sequential", async () => {
  const results = await sequential(
    () => trackedPromise(100),
    () => trackedPromise(100),
    () => trackedPromise(100),
  );

  assertEquals(results.length, 3);
  assertEquals(results.every((result) => !!result), true);
  
  let isIncremental = true;
  for (let i = 1; i < results.length; ++i) {
    const prevEval = results[i-1].evaluatedAt!;
    const currentEval = results[i].evaluatedAt!;
    if (currentEval < prevEval) {
      isIncremental = false;
      break;
    }
  }

  assertEquals(isIncremental, true);
});

Deno.test("sequentialLiteral", async () => {
  const results = await sequentialLiteral({
    a: () => trackedPromise(100),
    b: () => trackedPromise(100),
    c: () => trackedPromise(100),
  });

  const keys = Object.keys(results);
  const values = Object.values(results);
  assertEquals(keys.length, 3);
  assertArrayIncludes(keys, ["a", "b", "c"]);
  assertEquals(values.length, 3);
  assertEquals(values.every((result) => !!result), true);

  const arr = [results.a, results.b, results.c];

  let isIncremental = true;
  for (let i = 1; i < arr.length; ++i) {
    const prevEval = arr[i-1].evaluatedAt!;
    const currentEval = arr[i].evaluatedAt!;
    if (currentEval < prevEval) {
      isIncremental = false;
      break;
    }
  }

  assertEquals(isIncremental, true);
});

Deno.test('concurrentChunked', async () => {
  const results = await concurrentChunked(
    3,
    ...new Array(10).fill(undefined).map(() => () => trackedPromise(100)),
  );

  assertEquals(results.length, 10);

  const framedResults = toFrames(results, 3, { keepTrailing: true });
  assertEquals(framedResults.length, 4);
  assertEquals(framedResults.slice(0, -1).every((frame) => frame.length === 3), true);
  assertEquals(framedResults[framedResults.length - 1].length, 1);

  let isIncrements = true;
  for (let i = 1; i < framedResults.length; ++i) {
    const prevEval = framedResults[i-1][0].evaluatedAt!;
    const currentEval = framedResults[i][0].evaluatedAt!;
    if (currentEval < prevEval) {
      isIncrements = false;
      break;
    }
  }

  assertEquals(isIncrements, true);
});
