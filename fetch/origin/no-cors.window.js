// META: script=/common/utils.js
// META: script=/common/get-host-info.sub.js

promise_test(async function () {
  const stash = token(),
        origins = get_host_info(),
        redirectPath = "/fetch/origin/resources/redirect-and-stash.py";

  // Cross-origin -> same-origin will result in setting the tainted origin flag for the second
  // request.
  let url = origins.HTTP_ORIGIN + redirectPath + "?stash=" + stash;
  url = origins.HTTP_REMOTE_ORIGIN + redirectPath + "?stash=" + stash + "&location=" + encodeURIComponent(url);

  await fetch(url, { mode: "no-cors", method: "POST" });

  const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

  assert_equals(json[0], origins.HTTP_ORIGIN);
  assert_equals(json[1], "null");
}, "Origin header and 308 redirect");

promise_test(async function () {
  const stash = token(),
        origins = get_host_info(),
        redirectPath = "/fetch/origin/resources/redirect-and-stash.py";

  let url = origins.HTTP_ORIGIN + redirectPath + "?stash=" + stash;
  url = origins.HTTP_REMOTE_ORIGIN + redirectPath + "?stash=" + stash + "&location=" + encodeURIComponent(url);

  await new Promise(resolve => {
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.onload = () => {
      resolve();
      frame.remove();
    }
    document.body.appendChild(frame);
  });

  const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

  assert_equals(json[0], "no Origin header");
  assert_equals(json[1], "no Origin header");
}, "Origin header and GET navigation");

promise_test(async function () {
  const stash = token(),
        origins = get_host_info(),
        redirectPath = "/fetch/origin/resources/redirect-and-stash.py";

  let url = origins.HTTP_ORIGIN + redirectPath + "?stash=" + stash;
  url = origins.HTTP_REMOTE_ORIGIN + redirectPath + "?stash=" + stash + "&location=" + encodeURIComponent(url);

  await new Promise(resolve => {
    const frame = document.createElement("iframe");
    self.addEventListener("message", e => {
      if (e.data === "loaded") {
        resolve();
        frame.remove();
      }
    }, { once: true });
    frame.onload = () => {
      const doc = frame.contentDocument,
            form = doc.body.appendChild(doc.createElement("form")),
            submit = form.appendChild(doc.createElement("input"));
      form.action = url;
      form.method = "POST";
      submit.type = "submit";
      submit.click();
    }
    document.body.appendChild(frame);
  });

  const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

  assert_equals(json[0], "null");
  assert_equals(json[1], "null");
}, "Origin header and POST navigation");

function referrerPolicyFucnctor(referrerPolicy, isCors, expectedOrigin) {
  return async function () {
    const stash = token(),
          origins = get_host_info(),
          redirectPath = "/fetch/origin/resources/redirect-and-stash.py";

    let url = (isCors ? origins.HTTP_REMOTE_ORIGIN : origins.HTTP_ORIGIN) +
              redirectPath + "?stash=" + stash;

    await new Promise(resolve => {
      const frame = document.createElement("iframe");
      const rp = "no-referrer";
      frame.src = origins.HTTP_ORIGIN + redirectPath +
                  "?referrerPolicy=" + referrerPolicy + "&stash=" + stash;
      self.addEventListener("message", e => {
        if (e.data === "loaded") {
          resolve();
          frame.remove();
        }
      }, { once: true });
      frame.onload = () => {
        const doc = frame.contentDocument,
              form = doc.body.appendChild(doc.createElement("form")),
              submit = form.appendChild(doc.createElement("input"));
        form.action = url;
        form.method = "POST";
        submit.type = "submit";
        submit.click();
      }
      document.body.appendChild(frame);
    });

    const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

    assert_equals(json[0], "no Origin header");
    assert_equals(json[1], expectedOrigin);
  };
}

function referrerPolicyTestString(referrerPolicy, isCors) {
  return "Origin header and POST" + (isCors ? "Cross-origin" : "same-origin") +
         " navigation with Referrer-Policy " + referrerPolicy;
}

promise_test(referrerPolicyFucnctor("no-referrer", false, "null"),
             referrerPolicyTestString("no-referrer", false));

promise_test(referrerPolicyFucnctor("no-referrer", true, "null"),
             referrerPolicyTestString("no-referrer", true));

promise_test(referrerPolicyFucnctor("same-origin", false, "http://web-platform.test:8000"),
             referrerPolicyTestString("same-origin", false));

promise_test(referrerPolicyFucnctor("same-origin", true, "null"),
             referrerPolicyTestString("same-origin", true));

promise_test(referrerPolicyFucnctor("no-referrer-when-downgrade", false, "http://web-platform.test:8000"),
             referrerPolicyTestString("no-referrer-when-downgrade", false));

promise_test(referrerPolicyFucnctor("no-referrer-when-downgrade", true, "http://web-platform.test:8000"),
             referrerPolicyTestString("no-referrer-when-downgrade", true));
