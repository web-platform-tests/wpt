function finish_reftest() {
  document.documentElement.classList.remove("reftest-wait");
}

function finish_reftest_on_resize_or_timeout(element, timeout) {
  let ro = new ResizeObserver(() => finish_reftest);
  ro.observe(element);
  setTimeout(finish_reftest, timeout);
}
