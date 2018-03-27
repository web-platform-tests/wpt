// Common method used in vertical scrolling tests.
const same_origin_url = "/feature-policy/experimental-features/resources/feature-policy-vertical-scroll.html";
const cross_origin_url = "https://{{domains[www]}}:{{ports[https][0]}}" + same_origin_url;
const large_number = 1000000;
const visible_rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);

function rect_contains(rect, x, y) {
  return (rect.left <= x)  && (rect.right >= x) &&
         (rect.top <= y) && (rect.bottom >= y);
}

function rect_intersects(rect1, rect2) {
  return rect_contains(rect1, rect2.left, rect2.top) ||
         rect_contains(rect1, rect2.left, rect2.bottom) ||
         rect_contains(rect1, rect2.right, rect2.top) ||
         rect_contains(rect1, rect2.right, rect2.bottom);
}

function iframe() {
  return document.querySelector("iframe");
}

// Returns a promise which is resolved when the <iframe> is navigated to |url|
// and "load" handler has been called.
function loadUrlInIframe(url) {
  return new Promise((resolve) => {
    iframe().addEventListener("load", resolve);
    iframe().src = url;
  });
}

// Returns a promise which is resolved as soon as "message" is received.
function waitForMessage(message) {
  return new Promise((resolve) => {
    function handler(e) {
      if (e.data !== message)
        return;
      window.removeEventListener("message", handler);
      resolve();
    }
    window.addEventListener("message", handler);
  });
}

// Returns a promise which is resolved when the testing API for input is loaded.
function testAPIReady() {
  return new Promise((resolve) => {
    function checkForAPI() {
      if (window.touchScrollDown) {
        resolve();
      } else {
        step_timeout(checkForAPI);
      }
    }
    checkForAPI();
  });
}
