// Statically imports a specifier that 404s over the network, carrying the
// integrity of marker-module.mjs (see static-import-crossoriginstorage.mjs).
// It can only resolve once marker-module.mjs is in Cross-Origin Storage.
import defaultValue from './does-not-exist-static-import.mjs' with {
  integrity: 'sha256-9HhIS3040t7AAV1BzgsxUv5RLJUTDyhamWV7kh0XdGQ=',
  crossOriginStorage: '',
};

export const value = defaultValue;
