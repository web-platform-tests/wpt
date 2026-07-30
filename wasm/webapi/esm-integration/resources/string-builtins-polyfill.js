export function length() {
  throw new Error("existing builtin length should not be mapped");
}

export function newbuiltin(str) {
  return "polyfill:" + str;
}
