test(function() {
  let es = new EventSource("");
  assert_equals(es.url, document.documentURI,
                "Passing empty string to the EventSource constructor shouldn't throw.");
  es.close();
}, "Passing empty string to the EventSource constructor");

