// Test should set these:
// const expectSuccess = {'iframe': bool, 'frame': bool, 'object': bool, 'embed': bool};
// const setAllowPaymentRequest = bool;
// const testCrossOrigin = bool;

const paymentArgs = [[{supportedMethods: ['foo']}], {total: {label: 'label', amount: {currency: 'USD', value: '5.00'}}}];
const tests = {};

window.onmessage = (e) => {
  const result = e.data;
  const t = tests[result.urlQuery];
  t.step(() => {
    if (expectSuccess[result.urlQuery]) {
      assert_equals(result.message, 'Success');
    } else {
      assert_equals(result.message, 'Exception');
      assert_array_equals(result.details, [true /*ex instanceof DOMException*/,
                                           DOMException.SECURITY_ERR /*ex.code*/,
                                           'SecurityError' /*ex.name*/]);
    }
    t.done();
  });
};

['iframe', 'frame', 'object', 'embed'].forEach((tagName, i) => {
  tests[tagName] = async_test((t) => {
    const elm = document.createElement(tagName);
    if (setAllowPaymentRequest) {
      elm.setAttribute('allowpaymentrequest', '');
    }
    const path = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    const url = (testCrossOrigin ? "https://{{domains[www1]}}:{{ports[https][0]}}" : "") +
                path + "echo-PaymentRequest.html?" + tagName;
    if (tagName === 'object') {
      elm.data = url;
    } else {
      elm.src = url;
    }
    elm.onload = t.step_func(() => {
      window[i].postMessage('What is the result of new PaymentRequest(...)?', '*');
    });
    elm.onerror = t.unreached_func('elm.onerror');
    document.body.appendChild(elm);
  }, tagName);
});
