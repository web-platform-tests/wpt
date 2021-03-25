// META: global=window,worker
// META: script=../resources/utils.js
// META: script=/common/utils.js
// META: script=/common/get-host-info.sub.js

function testUpload(desc, url, method, createBody, expectedBody) {
  const requestInit = {"method": method}
  promise_test(function(test){
    const body = createBody();
    if (body) {
      requestInit["body"] = body;
    }
    return fetch(url, requestInit).then(function(resp) {
      return resp.text().then((text)=> {
        assert_equals(text, expectedBody);
      });
    });
  }, desc);
}

function testUploadFailure(desc, url, method, createBody) {
  const requestInit = {"method": method};
  promise_test(t => {
    const body = createBody();
    if (body) {
      requestInit["body"] = body;
    }
    return promise_rejects_js(t, TypeError, fetch(url, requestInit));
  }, desc);
}

const url = RESOURCES_DIR + "echo-content.h2.py"

testUpload("Fetch with POST with ReadableStream", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode("Test"));
      controller.close();
    }})
  },
  "Test");
testUploadFailure("Fetch with POST with ReadableStream containing String", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      controller.enqueue("Test");
      controller.close();
    }})
  });
testUploadFailure("Fetch with POST with ReadableStream containing null", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      controller.enqueue(null);
      controller.close();
    }})
  });
testUploadFailure("Fetch with POST with ReadableStream containing number", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      controller.enqueue(99);
      controller.close();
    }})
  });
testUploadFailure("Fetch with POST with ReadableStream containing ArrayBuffer", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      controller.enqueue(new ArrayBuffer());
      controller.close();
    }})
  });
testUploadFailure("Fetch with POST with ReadableStream containing Blob", url,
  "POST",
  () => {
    return new ReadableStream({start: controller => {
      controller.enqueue(new Blob());
      controller.close();
    }})
  });
