var testCases = {
    "HKDF": [
        {length: 256, expected: algorithms["HKDF"].derivation},
        {length: 0, expected: emptyArray},
    ],
    "PBKDF2": [
        {length: 256, expected: algorithms["PBKDF2"].derivation},
        {length: 0, expected: undefined}, // not a multiple of 8
    ],
    "ECDH": [
        {length: 256, expected: algorithms["ECDH"].derivation},
        {length: 0, expected: emptyArray},
    ],
    "X25519": [
        {length: 256, expected: algorithms["X25519"].derivation},
        {length: 0, expected: emptyArray},
    ],
}
