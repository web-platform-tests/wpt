// META: title=`Origin.from(Worker)`

const src = `
const originA = Origin.from(globalThis);
const originB = Origin.from(globalThis);

self.postMessage({
  "isOpaque": originA.opaque,
  "sameOrigin": originA.isSameOrigin(originB),
});
`;

async_test(t => {
  const dataURL = `data:text/html;base64,${btoa(src)}`;
  const worker = new Worker(dataURL);
  worker.onmessage = e => {
    assert_true(e.data.isOpaque, "Origin created from data URL Worker should be an opaque origin.");
    assert_false(e.data.sameOrigin, "Two data URL opaque origins should not be same-origin with one another.");
    t.done();
  };
}, "Comparison of `Origin.from(Worker)` for opaque data URL origin.");

async_test(t => {
  const blob = new Blob([src], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  worker.onmessage = e => {
    assert_false(e.data.isOpaque, "Origin created from Worker should be a tuple origin.");
    assert_true(e.data.sameOrigin, "Two tuple origins should be same-origin with one another.");
    t.done();
  };
}, "Comparison of `Origin.from(Worker)` tuple origins.");
