// These tests verify that stream creation is not affected by changes to
// Object.prototype.

const creationCases = {
  fetch: async () => fetch(location.href),
  request: () => new Request(location.href, {method: 'POST', body: 'hi'}),
  response: () => new Response('bye'),
  consumeEmptyResponse: () => new Response().text(),
  consumeNonEmptyResponse: () => new Response(new Uint8Array([64])).text(),
  consumeEmptyRequest: () => new Request(location.href).text(),
  consumeNonEmptyRequest: () => new Request(location.href,
                                            {method: 'POST', body: 'yes'}).arrayBuffer(),
};

for (creationCase of Object.keys(creationCases)) {
  promise_test(async t => {
    Object.prototype.start = () => {
      throw Error('Object.prototype.start was called');
    };
    t.add_cleanup(() => delete Object.prototype.start);
    await creationCases[creationCase]();
  }, `throwing Object.prototype.start() should not affect stream creation by ` +
     `'${creationCase}'`);

  for (accessorName of ['type', 'size', 'highWaterMark']) {
    promise_test(async t => {
      Object.defineProperty(Object.prototype, accessorName, {
        get() { throw Error(`Object.prototype.${accessorName} was accessed`); },
        configurable: true
      });
      t.add_cleanup(() => delete Object.prototype[accessorName]);
      await creationCases[creationCase]();
    }, `throwing Object.prototype.${accessorName} accessor should not affect ` +
       `stream creation by '${creationCase}'`);
  }
}
