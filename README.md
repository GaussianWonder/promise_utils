# promise utils

- [promise utils](#promise-utils)
  - [concurrent](#concurrent)
  - [concurrentLiteral](#concurrentliteral)
  - [sequential](#sequential)
  - [sequentialLiteral](#sequentialliteral)
  - [concurrentChunked](#concurrentchunked)

> You are probably better off using [effect-js](https://github.com/Effect-TS/effect)

## concurrent

> Just a Promise.all wrapper

## concurrentLiteral

Similar to [concurrent](#concurrent), but accepts and correctly types results based on an incoming object.

```ts
type Expected = { // this is inferred
  a: number;
  b: string;
  c: boolean;
};

const results: Expected = await concurrentLiteral({
  a: Promise.resolve(1),
  b: Promise.resolve('2'),
  c: Promise.resolve(true),
});
```

## sequential

Accepts an array of promise factories and resolves them sequentially.

```ts
type Expected = [number, string, boolean]; // this is inferred

const results: Expected = await sequential([
  () => Promise.resolve(1),
  () => Promise.resolve('2'),
  () => Promise.resolve(true),
]);

// results: [1, '2', true] however '2' is not evaluated until 1 is resolved, and so on...
```

## sequentialLiteral

Similar to [sequential](#sequential) and [concurrentLiteral](#concurrentliteral), but accepts and correctly types results based on an incoming object.

```ts
type Expected = { // this is inferred
  a: number;
  b: string;
  c: boolean;
};

const results: Expected = await sequentialLiteral({
  a: () => Promise.resolve(1),
  b: () => Promise.resolve('2'),
  c: () => Promise.resolve(true),
});
```

> The order in which this is resolved is based on Object.keys order.

## concurrentChunked

Accepts an array of promise factories and resolves them concurrently in chunks, each chunk sequentially.

```ts
type Expected = [number, string, boolean]; // this is inferred

const results: Expected = await concurrentChunked(
  2,
  () => Promise.resolve(1),     // frame 1
  () => Promise.resolve('2'),   // frame 1
  () => Promise.resolve(true),  // frame 2
);
```

Frames with the same index will be concurrently resolved, sequentially related to every other frame.
