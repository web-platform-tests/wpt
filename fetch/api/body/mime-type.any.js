[
 () => new Request("about:blank", { headers: { "Content-Type": "text/plain" } }),
 () => new Response("", { headers: { "Content-Type": "text/plain" } })
].forEach(bodyContainerCreator => {
  promise_test(async t => {
    const bodyContainer = bodyContainerCreator();
    const newMIMEType = "test/test";
    bodyContainer.headers.set("Content-Type", newMIMEType);
    const blob = await bodyContainer.blob();
    assert_equals(blob.type, newMIMEType);
  });
});
