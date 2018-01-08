// After all the expected timeouts fire, signal the main page the test is
// complete.
let expectedFiringCount = 5;
const checkCompletion = () => {
  if (--expectedFiringCount == 0)
    postMessage('DONE');
};

// Execute script in a string.
setTimeout('postMessage("PASS: timeout 1"); checkCompletion()', 20);

// Execute a function.
// Note it has the same timeout value as previous timeout, but should be fired
// reliably after it because the timer heap maintains the queueing order as well
// as firing time.
setTimeout(() => {
  postMessage('PASS: timeout 2');
  checkCompletion();
}, 20);

// Clear a timeout before it fires.
const singleShot = setTimeout(
    'postMessage("FAIL: this timer should be removed before firing")', 0);
clearTimeout(singleShot);

// Clear interval after it fires.
const intervalTimer = setInterval(
    'postMessage("PASS: interval 3");' +
    'clearInterval(intervalTimer);' +
    'checkCompletion();', 20);

// Set repeated interval. It will terminate the test after 2 iterations.
setInterval('postMessage("PASS: repeated interval"); checkCompletion();', 30);
