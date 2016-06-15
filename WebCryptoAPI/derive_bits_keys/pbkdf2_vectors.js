
function getTestVectors() {
    var testVectors = [];

    testVectors.push(
        {
            name: "Non-empty password, non-empty salt, SHA-1, 100 iterations, 512 bits",
            hash: "SHA-1",
            baseKey: null,
            baseKeyBuffer: new Uint8Array([1, 2, 3, 4, 5, 6]),
            salt: new Uint8Array([6, 5, 4]),
            iterations: 100,
            length: 512
        }
    );

    return testVectors;
}
