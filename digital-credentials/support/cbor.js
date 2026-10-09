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

export function concat(arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const res = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    res.set(a, offset);
    offset += a.length;
  }
  return res;
}

export function cborUint(val) {
  return encodeHead(0, val);
}

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
  const parts = [encodeHead(5, pairs.length)];
  for (const [k, v] of pairs) {
    parts.push(k);
    parts.push(v);
  }
  return concat(parts);
}

export function cborTag(tag, item) {
  return concat([encodeHead(6, tag), item]);
}

export function cborBool(val) {
  return new Uint8Array([val ? 0xf5 : 0xf4]);
}

export function toBase64Url(arr) {
  const b64 = btoa(String.fromCharCode.apply(null, arr));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
