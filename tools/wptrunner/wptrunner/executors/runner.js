document.title = '%(title)s';

var message_queue = [];
var source = null;

/**
 * In preparation to execute a test, testdriver issues a number of messages
 * which should be queued until execution time. During execution, testdriver
 * consumes the queued messages by repeatedly "resuming" via `do_testharness`.
 * The sequence of these events is variable, so the handler must account for
 * cases where "resume" requests arrive before any messages are available (by
 * caching the request's source) and where messages arrive before "resume"
 * requests (by queuing the messages).
 */
window.addEventListener("message", function(event) {
  if (!event.data) {
    return;
  }

  if (event.data.type === "testdriver-resume") {
    source = event.source;
  } else {
    message_queue.push(event.data);
  }

  if (!source || !message_queue.length) {
    return;
  }

  reply(source, message_queue[0]);
  source = null;
  message_queue.shift();
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
