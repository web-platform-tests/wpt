// META: global=window,worker
// META: title=Response consume BYOB blob
// META: script=../resources/utils.js

var textData = JSON.stringify("This is response's body");
var blob = new Blob([textData], { "type": "text/plain" });

promise_test(function (test) {
  var response = new Response(blob);
  return validateStreamFromString(response.body.getReader({ mode: "byob" }), textData);
}, `Read blob response's body as readableStream with mode="byob"}`);
