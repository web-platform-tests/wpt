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

  assert_equals(json[0], origins.HTTP_ORIGIN, "first origin should equal this origin");
  assert_equals(json[1], "null", "second origin should be opaque and therefore null");
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

  assert_equals(json[0], "no Origin header", "first origin should equal this origin");
  assert_equals(json[1], "no Origin header", "second origin should be opaque and therefore null");
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
    document.body.appendChild(frame);
    const doc = frame.contentDocument,
          form = doc.body.appendChild(doc.createElement("form")),
          submit = form.appendChild(doc.createElement("input"));
    form.action = url;
    form.method = "POST";
    submit.type = "submit";
    submit.click();
  });

  const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

  assert_equals(json[0], "null", "first origin should equal this origin");
  assert_equals(json[1], "null", "second origin should be opaque and therefore null");
}, "Origin header and POST navigation");
