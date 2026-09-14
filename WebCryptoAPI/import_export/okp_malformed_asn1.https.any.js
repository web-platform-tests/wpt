// META: title=WebCryptoAPI: OKP imports reject malformed ASN.1

const vectors = [
  {
    algorithm: "Ed25519",
    pkcs8: "302e020100300506032b6570042204200007070707070707070707070707070707070707070707070707070707070707",
    spki: "302a300506032b6570032100ff812f84e53570c36ae9479aad71e649c3cc4a04a6768632150febdd66a238a8",
  },
  {
    algorithm: "X25519",
    pkcs8: "302e020100300506032b656e042204200007070707070707070707070707070707070707070707070707070707070707",
    spki: "302a300506032b656e03210013be4feaeaf204c7fd3358fc9c00721881d174278128227ec674f37f7fe97b6d",
  },
];

function bytes(hex) {
  return new Uint8Array(hex.match(/../g).map(value => Number.parseInt(value, 16)));
}

for (const vector of vectors) {
  for (const format of ["pkcs8", "spki"]) {
    promise_test(async test => {
      const encoded = bytes(vector[format]);
      const usages = format === "pkcs8"
        ? (vector.algorithm === "Ed25519" ? ["sign"] : ["deriveBits"])
        : (vector.algorithm === "Ed25519" ? ["verify"] : []);
      await promise_rejects_dom(
        test,
        "DataError",
        crypto.subtle.importKey(format, encoded.slice(0, -1), vector.algorithm, true, usages),
        "truncated input",
      );
      const invalidTag = encoded.slice();
      invalidTag[0] = 0x31;
      await promise_rejects_dom(
        test,
        "DataError",
        crypto.subtle.importKey(format, invalidTag, vector.algorithm, true, usages),
        "invalid outer ASN.1 tag",
      );
    }, `${vector.algorithm} rejects malformed ${format}`);
  }
}
