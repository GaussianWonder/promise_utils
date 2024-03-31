type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

interface ToFramesOpts {
  keepTrailing?: boolean;
  throwIfTrailing?: boolean;
}

export function toFrames<T, I extends number>(
  arr: T[],
  frameLength: I,
  opts: ToFramesOpts = {},
): Tuple<T, I>[] {
  const { keepTrailing, throwIfTrailing } = opts;

  if (throwIfTrailing && (arr.length % frameLength) !== 0) {
    throw new Error(
      `Array length ${arr.length} is not a multiple of frame length ${frameLength}, this will result in a trailing tuple of length < ${frameLength}`,
    );
  }

  if (!frameLength) throw new Error('frameLength must be greater than 0');
  const startState = {
    frames: [] as T[][],
    current: [] as T[],
  };

  const { frames, current } = arr.reduce(
    ({ frames, current }, value, index) => {
      const nThItemNumber = index + 1;
      if (nThItemNumber % frameLength === 0) {
        current.push(value);
        frames.push(current);
        return {
          frames,
          current: [],
        };
      }
      current.push(value);
      return {
        frames,
        current,
      };
    },
    startState,
  );

  if (current && current.length && keepTrailing) frames.push(current);

  return frames as Tuple<T, I>[];
}
