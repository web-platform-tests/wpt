import {
  mutableValue,
  setGlobal,
  getGlobal,
} from "./mutable-global-export.wasm";

export function readNamed() {
  return mutableValue;
}

export { setGlobal, getGlobal };
