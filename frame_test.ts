import { assertEquals, assertThrows } from 'https://deno.land/std@0.215.0/assert/mod.ts';
import { toFrames } from "./frames.ts";

Deno.test("frame splitting", () => {
  const arr = new Array(10).fill(undefined).map((_, i) => i);
  const frameLength = 2;
  const split = toFrames(arr, frameLength);

  assertEquals(split.length, arr.length / frameLength);
  assertEquals(split.every((frame) => frame.length === frameLength), true);
});

Deno.test("frame splitting with trail", () => {
  const arr = new Array(10).fill(undefined).map((_, i) => i);
  const frameLength = 3;
  const split = toFrames(arr, frameLength, { keepTrailing: true });

  assertEquals(split.length, Math.ceil(arr.length / frameLength));
  assertEquals(split.slice(0, -1).every((frame) => frame.length === frameLength), true);
  assertEquals(split[split.length - 1].length, arr.length % frameLength);
});

Deno.test("disallow trailing frames", () => {
  const arr = new Array(10).fill(undefined).map((_, i) => i);
  const frameLength = 3;

  assertThrows(() => toFrames(arr, frameLength, { throwIfTrailing: true }));
});

Deno.test("discard trailing frame", () => {
  const arr = new Array(10).fill(undefined).map((_, i) => i);
  const frameLength = 3;
  const split = toFrames(arr, frameLength, { keepTrailing: false });

  assertEquals(split.length, Math.floor(arr.length / frameLength));
  assertEquals(split.every((frame) => frame.length === frameLength), true);
})