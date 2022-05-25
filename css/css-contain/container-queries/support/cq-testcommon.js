function assert_implements_container_queries() {
  assert_implements(CSS.supports("container-type:size"), "Basic support for container queries required");
}

function polyfill_declarative_shadow_dom(root) {
  root.querySelectorAll("template[shadowroot]").forEach(template => {
    const mode = template.getAttribute("shadowroot");
    const shadowRoot = template.parentNode.attachShadow({ mode });
    shadowRoot.appendChild(template.content);
    template.remove();
    polyfill_declarative_shadow_dom(shadowRoot);
  });
}

/**
 * A Container Query polyfill will likely be implemented using asynchronous APIs
 * like `MutationObserver` or `ResizeObserver`, meaning the effects of writes
 * will not be synchronously observable.
 *
 * By calling `window.setWaitForPolyfill`, a polyfill can provide a function that
 * tests can use to wait until it's safe to read the effects of writes. Immediately
 * prior to attempt to read any layout or style state, tests should check if the
 * function has been set, and if so, await it:
 *
 *     if (waitForPolyfill) await waitForPolyfill();
 *     assert_equals(getComputedStyle(target), ...);
 *
 * Note: Even though it would be safe to `await null`, an additional microtask could
 * hide bugs in browser implementations. Therefore, a test should always check first,
 * and only await if `waitForPolyfill` has been explicitly set.
 */
var waitForPolyfill = null;
window.setWaitForPolyfill = function setWaitForPolyfill(impl) {
  waitForPolyfill = impl;
}
