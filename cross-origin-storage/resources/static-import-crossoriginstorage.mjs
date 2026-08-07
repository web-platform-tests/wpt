// The integrity value below is the fixed SHA-256/base64 digest of
// marker-module.mjs's exact contents (static import attributes must be
// literals, so this can't be computed at runtime the way the dynamic
// import() tests do).
import defaultValue from './marker-module.mjs' with {
  integrity: 'sha256-9HhIS3040t7AAV1BzgsxUv5RLJUTDyhamWV7kh0XdGQ=',
  crossOriginStorage: [],
};

export const value = defaultValue;
