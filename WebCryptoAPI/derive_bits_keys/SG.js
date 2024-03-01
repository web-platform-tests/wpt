// Módulo de pruebas
async function runTests() {
    const testData = getTestData();
    const baseKeys = await setUpBaseKeys(testData.derivedKeys);

    for (const derivedKeySize in testData.derivations) {
        for (const saltSize in testData.derivations[derivedKeySize]) {
            for (const hashName in testData.derivations[derivedKeySize][saltSize]) {
                for (const infoSize in testData.derivations[derivedKeySize][saltSize][hashName]) {
                    const testName = `${derivedKeySize} derivedKey, ${saltSize} salt, ${hashName}, with ${infoSize} info`;
                    const algorithm = { name: "HKDF", salt: testData.salts[saltSize], info: testData.infos[infoSize], hash: hashName };

                    // Check deriveBits
                    await testDeriveBits(algorithm, baseKeys[derivedKeySize], testData.derivations[derivedKeySize][saltSize][hashName][infoSize], testName);

                    // Check with 0 length
                    await testDeriveBitsWithZeroLength(algorithm, baseKeys[derivedKeySize], testName);

                    // Check deriveKey for each derivedKeyType
                    for (const derivedKeyType of testData.derivedKeyTypes) {
                        const keyTestName = generateKeyTestName(derivedKeyType, derivedKeySize, saltSize, hashName, infoSize);
                        await testDeriveKey(algorithm, baseKeys[derivedKeySize], derivedKeyType, keyTestName);
                        // Additional error condition tests for deriveKey
                        await testDeriveKeyErrorConditions(algorithm, derivedKeyType, derivedKeySize, saltSize, hashName);
                    }

                    // Additional error condition tests for deriveBits
                    await testDeriveBitsErrorConditions(algorithm, baseKeys[derivedKeySize], derivedKeySize, saltSize, hashName, infoSize);
                }
            }
        }
    }
}

// Funciones auxiliares
async function testDeriveBits(algorithm, baseKey, expectedDerivation, testName) {
    try {
        const derivation = await crypto.subtle.deriveBits(algorithm, baseKey, 256);
        assertBuffersEqual(derivation, expectedDerivation, `${testName}: Derived correct key`);
    } catch (err) {
        assertUnreached(`${testName}: deriveBits failed with error ${err.name}: ${err.message}`);
    }
}

async function testDeriveBitsWithZeroLength(algorithm, baseKey, testName) {
    try {
        const derivation = await crypto.subtle.deriveBits(algorithm, baseKey, 0);
        assertEqual(derivation.byteLength, 0, `${testName} with 0 length: Derived correctly empty key`);
    } catch (err) {
        assertEqual(err.name, "OperationError", `${testName} with 0 length: deriveBits with 0 length correctly threw OperationError: ${err.message}`);
    }
}

async function testDeriveKey(algorithm, baseKey, derivedKeyType, testName) {
    try {
        const key = await crypto.subtle.deriveKey(algorithm, baseKey, derivedKeyType.algorithm, true, derivedKeyType.usages);
        const exportedKey = await crypto.subtle.exportKey("raw", key);
        assertBuffersEqual(exportedKey, expectedDerivation.slice(0, derivedKeyType.algorithm.length / 8), `${testName}: Exported key matches correct value`);
    } catch (err) {
        assertUnreached(`${testName}: deriveKey failed with error ${err.name}: ${err.message}`);
    }
}

async function testDeriveKeyErrorConditions(algorithm, derivedKeyType, derivedKeySize, saltSize, hashName) {
    // ... Add error condition tests for deriveKey
}

async function testDeriveBitsErrorConditions(algorithm, baseKey, derivedKeySize, saltSize, hashName, infoSize) {
    // ... Add error condition tests for deriveBits
}

// Resto del código...


                      
