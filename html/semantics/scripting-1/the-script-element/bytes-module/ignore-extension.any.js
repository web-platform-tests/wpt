// META: global=window,dedicatedworker,sharedworker

for (const name of ["file", "file.bin", "file.js", "file.txt"]) {
  promise_test(async t => {
    const result = await import(`./${name}`, { with: { type: "bytes" } });
    assert_equals(result, "mycontent\n");
  }, `Extension: ${name}`);
}