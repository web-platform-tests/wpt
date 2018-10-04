var callback = arguments[arguments.length - 1];

console.log("callback script");
window.testdriver_callback = callback;
window.process_next_event();
