// Null length
// "Null" is not valid per the current spec
//   - https://github.com/w3c/webcrypto/issues/322
//   - https://github.com/w3c/webcrypto/issues/329
//
// Proposal for a spec change:
//   - https://github.com/w3c/webcrypto/pull/345
var testCases = {
    "HKDF": [
        {length: null, expected: undefined },
        {length: undefined, expected: undefined },
    ],
    "PBKDF2": [
        {length: null, expected: undefined },
        {length: undefined, expected: undefined },
    ],
    "ECDH": [
        {length: null, expected: algorithms["ECDH"].derivation},
        {length: undefined, expected: algorithms["ECDH"].derivation},
    ],
    "X25519": [
        {length: null, expected: algorithms["X25519"].derivation},
        {length: undefined, expected: algorithms["X25519"].derivation},
    ],
}
