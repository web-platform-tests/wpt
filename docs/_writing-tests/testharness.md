---
layout: page
title: testharness.js Tests
order: 4
---

testharness.js tests are the correct type of test to write in any
situation where you are not specifically interested in the rendering
of a page, and where human interaction isn't required; these tests are
written in JavaScript using a framework called `testharness.js`. It is
documented in two sections:

  * [testharness.js Documentation][testharness-api] — An introduction
    to the library and a detailed API reference.

  * [idlharness.js Documentation][idlharness] — A library for testing
     IDL interfaces using `testharness.js`.

As always, we recommend reading over the [general guidelines][] for
all test types.

## Auto-generated test boilerplate

Tests for HTML documents, and dedicated, shared, and service workers, can be written as simple
JavaScript files without boilerplate by following conventions established below.

### Standalone HTML document tests (Window global object)

Tests that only require JavaScript running in an HTML document can be written using a `*.window.js`
resource. The boilerplate will be generated automatically when you load `*.window.html`. E.g., for
`example.window.js` the corresponding (generated) test resource will be `example.window.html`.

### Standalone worker tests (DedicatedWorkerGlobalScope, SharedWorkerGlobalScope, and ServiceWorkerGlobalScope global objects)

Tests that need to run in dedicated, shared, and service workers can be written using a
`*.worker.js` resource (with boilerplate at `*.worker.html`, `*.worker.sharedworker.html`, and
`*.worker.serviceworker.https.html`). To exclude service workers, use a `*.worker-no-sw.js` resource
(with boilerplate at `*.worker-no-sw.html` and `*.worker-no-sw.sharedworker.html`). To
exclusively target service workers, use `*.serviceworker.js` (with boilerplate at
`*.serviceworker.https.html`).

Note that service workers also require the `.https` signifier as they only work in
[secure contexts](https://w3c.github.io/webappsec-secure-contexts/).

For example, one could write a test for the `FileReaderSync` API by creating a
`FileAPI/FileReaderSync.worker-no-sw.js` as follows:

    importScripts("/resources/testharness.js");
    test(function () {
      var blob = new Blob(["Hello"]);
      var fr = new FileReaderSync();
      assert_equals(fr.readAsText(blob), "Hello");
    }, "FileReaderSync#readAsText.");
    done();

This test could then be run from `FileAPI/FileReaderSync.worker-no-sw.html` and
`FileAPI/FileReaderSync.worker-no-sw.sharedworker.html`.

### Standalone HTML document and worker tests

Tests for features that span HTML documents and workers can be written using a `*.window-worker.js`
resource (with boilerplate at `*.window-worker.html`, `*.window-worker.worker.html`,
`*.window-worker.sharedworker.html`, and `*.window-worker.serviceworker.https.html`). To exclude
service workers, use a `*.window-worker-no-sw.js` resource (with boilerplate at
`*.window-worker-no-sw.html`, `*.window-worker-no-sw.worker.html`, and
`*.window-worker-no-sw.sharedworker.html`).

For example, one could write a test for the `Blob` constructor by
creating a `FileAPI/Blob-constructor.window-worker.js` as follows:

    test(function () {
      var blob = new Blob();
      assert_equals(blob.size, 0);
      assert_equals(blob.type, "");
      assert_false(blob.isClosed);
    }, "The Blob constructor.");

This test could then be run from `FileAPI/Blob-constructor.window-worker.html` as well as
`FileAPI/Blob-constructor.window-worker.serviceworker.https.html` and the other worker locations as
per above.

To check if your test is run from a window or worker you can use the following two methods that will
be made available by the framework:

    self.GLOBAL.isWindow()
    self.GLOBAL.isWorker()

### Including other JavaScript resources in auto-generated boilerplate tests

Use `// META: script=link/to/resource.js` at the beginning of the resource. For example,

    // META: script=/common/utils.js
    // META: script=resources/utils.js

can be used to include both the global and a local `utils.js` in a test.

### Specifying a timeout of long in auto-generated boilerplate tests

Use `// META: timeout=long` at the beginning of the resource.


[general guidelines]: {{ site.baseurl }}{% link _writing-tests/general-guidelines.md %}
[testharness-api]: {{ site.baseurl }}{% link _writing-tests/testharness-api.md %}
[idlharness]: {{ site.baseurl }}{% link _writing-tests/idlharness.md %}
