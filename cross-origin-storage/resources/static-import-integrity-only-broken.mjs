// Statically imports a specifier that 404s over the network, carrying the
// integrity of marker-module.mjs and no `crossOriginStorage` attribute. With
// no Cross-Origin Storage participation, the import must fail.
import defaultValue from './does-not-exist-static-import-integrity-only.mjs' with {
  integrity: 'sha256-9HhIS3040t7AAV1BzgsxUv5RLJUTDyhamWV7kh0XdGQ=',
};

export const value = defaultValue;
