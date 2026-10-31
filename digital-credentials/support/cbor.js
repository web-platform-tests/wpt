export function encodeHead(majorType, val) {
  if (val < 24) {
    return new Uint8Array([(majorType << 5) | val]);
  } else if (val < 256) {
    return new Uint8Array([(majorType << 5) | 24, val]);
  } else if (val < 65536) {
    return new Uint8Array([(majorType << 5) | 25, val >> 8, val & 0xff]);
  } else {
    return new Uint8Array([
      (majorType << 5) | 26,
      val >> 24,
      (val >> 16) & 0xff,
      (val >> 8) & 0xff,
      val & 0xff,
    ]);
  }
}

export const concat = (arrays) => new Uint8Array(arrays.flatMap((a) => [...a]));

export function cborBytes(arr) {
  return concat([encodeHead(2, arr.length), arr]);
}

export function cborText(str) {
  const arr = new TextEncoder().encode(str);
  return concat([encodeHead(3, arr.length), arr]);
}

export function cborArray(items) {
  return concat([encodeHead(4, items.length), ...items]);
}

export function cborMap(pairs) {
  return concat([encodeHead(5, pairs.length), ...pairs.flat()]);
}

export function cborTag(tag, item) {
  return concat([encodeHead(6, tag), item]);
}

export function cborBool(val) {
  return new Uint8Array([val ? 0xf5 : 0xf4]);
}
