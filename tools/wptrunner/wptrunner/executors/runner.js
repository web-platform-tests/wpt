document.title = '%(title)s';

var message_queue = [];

/**
 * In preparation to execute a test, testdriver issues a number of messages
 * which should be queued until execution time. During execution, testdriver
 * consumes the queued messages by repeatedly "resuming" via `do_testharness`.
 */
window.addEventListener("message", function(event) {
  if (!event.data || !event.data.type) {
    return;
  }

  if (event.data.type === "testdriver-resume") {
    var next_message = message_queue.shift();
    reply(event.source, next_message);
  } else {
    message_queue.push(event.data);
  }
}, false);

function reply(source, data) {
  var payload = undefined;

  switch(data.type) {
  case "complete":
    var tests = data.tests;
    var status = data.status;

    var subtest_results = tests.map(function(x) {
      return [x.name, x.status, x.message, x.stack];
    });
    payload = [status.status,
               status.message,
               status.stack,
               subtest_results];
    clearTimeout(window.timer);
    break;
  case "action":
    payload = data;
    break;
  default:
    return;
  }

  source.postMessage({
      type: "testdriver-next message",
      message: [window.url, data.type, payload]
    },
    "*"
  );
}
