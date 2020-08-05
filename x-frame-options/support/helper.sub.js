function xfo_simple_tests({ headerValue, headerValue2, cspValue, sameOriginAllowed, crossOriginAllowed }) {
  const value2QueryString = headerValue2 !== undefined ? `&value2=${headerValue2}` : ``;
  const cspQueryString = cspValue !== undefined ? `&csp_value=${cspValue}` : ``;

  const valueMessageString = headerValue === "" ? "(the empty string)" : headerValue;
  const value2MessageString = headerValue2 !== undefined ? `;${headerValue2}` : ``;
  const cspMessageString = cspValue !== undefined ? ` with CSP ${cspValue}` : ``;

  xfo_test({
    url: `/x-frame-options/support/xfo.py?value=${headerValue}${value2QueryString}${cspQueryString}`,
    check: sameOriginAllowed ? "loaded message" : "no message",
    message: `${valueMessageString}${value2MessageString} ${sameOriginAllowed ? "allows" : "blocks"} same-origin framing${cspMessageString}`
  });

  xfo_test({
    url: `http://{{domains[www]}}:{{ports[http][0]}}/x-frame-options/support/xfo.py?value=${headerValue}${value2QueryString}${cspQueryString}`,
    check: crossOriginAllowed ? "loaded message" : "no message",
    message: `${valueMessageString}${value2MessageString} ${crossOriginAllowed ? "allows" : "blocks"} cross-origin framing${cspMessageString}`
  });
}

function xfo_test({ url, check, message }) {
  async_test(t => {
    const i = document.createElement("iframe");
    i.src = url;

    switch (check) {
      case "loaded message": {
        waitForMessageFrom(i, t).then(t.step_func_done(e => {
          assert_equals(e.data, "Loaded");
        }));
        break;
      }
      case "failed message": {
        waitForMessageFrom(i, t).then(t.step_func_done(e => {
          assert_equals(e.data, "Failed");
        }));
        break;
      }
      case "no message": {
        waitForMessageFrom(i, t).then(t.unreached_func("Frame should not have sent a message."));
        i.onload = t.step_func_done(() => {
          assert_equals(i.contentDocument, null);
        });
        break;
      }
      default: {
        throw new Error("Bad test");
      }
    }

    document.body.append(i);
    t.add_cleanup(() => i.remove());
  }, message);
}

function waitForMessageFrom(frame, test) {
  return new Promise(resolve => {
    window.addEventListener("message", test.step_func(e => {
      if (e.source == frame.contentWindow) {
        resolve(e);
      }
    }));
  });
}
