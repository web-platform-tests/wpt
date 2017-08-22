var callback = arguments[arguments.length - 1];
window.timeout_multiplier = %(timeout_multiplier)d;

window.message_queue = [];

window.current_listener = window.addEventListener(
  "message", function(event) {
    window.message_queue.push(event);
  }, false);

window.win = window.open("%(abs_url)s", "%(window_id)s");

window.timer = setTimeout(function() {
  window.win.timeout();
  window.win.close();
}, %(timeout)s);
