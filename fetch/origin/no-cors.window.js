// META: script=/common/utils.js
// META: script=/common/get-host-info.sub.js
const origins = get_host_info();

promise_test(async function () {
  const stash = token(),
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

var NavigationDestination = {
  SameOrigin: 1,
  CrossOrigin: 2,
  properties: {
    1: {name: "Same-Origin", origin: origins.HTTP_ORIGIN},
    2: {name: "Cross-Origin", origin: origins.HTTP_REMOTE_ORIGIN},
  }
}

function referrerPolicyFunctor(referrerPolicy, navigationDestination, expectedOrigin) {
  return async function () {
    const stash = token(),
          referrerPolicyPath = "/fetch/origin/resources/referrer-policy.py";
          redirectPath = "/fetch/origin/resources/redirect-and-stash.py";


    let url = NavigationDestination.properties[navigationDestination].origin +
              redirectPath + "?stash=" + stash;

    await new Promise(resolve => {
      const frame = document.createElement("iframe");
      frame.src = origins.HTTP_ORIGIN + referrerPolicyPath +
                  "?referrerPolicy=" + referrerPolicy;
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

        frame.onload = null;
      }
      document.body.appendChild(frame);
    });

    const json = await (await fetch(redirectPath + "?dump&stash=" + stash)).json();

    assert_equals(json[0], expectedOrigin);
  };
}

function referrerPolicyTestString(referrerPolicy, navigationDestination) {
  return "Origin header and POST " +
         NavigationDestination.properties[navigationDestination].name +
         " navigation with Referrer-Policy " + referrerPolicy;
}

[
  {
    "policy": "no-referrer",
    "expectedOriginForSameOrigin": "null",
    "expectedOriginForCrossOrigin": "null"
  },
  {
    "policy": "same-origin",
    "expectedOriginForSameOrigin": origins.HTTP_ORIGIN,
    "expectedOriginForCrossOrigin": "null"
  },
  {
    "policy": "origin-when-cross-origin",
    "expectedOriginForSameOrigin": origins.HTTP_ORIGIN,
    "expectedOriginForCrossOrigin": origins.HTTP_ORIGIN
  },
  {
    "policy": "no-referrer-when-downgrade",
    "expectedOriginForSameOrigin": origins.HTTP_ORIGIN,
    "expectedOriginForCrossOrigin": origins.HTTP_ORIGIN
  },
  {
    "policy": "unsafe-url",
    "expectedOriginForSameOrigin": origins.HTTP_ORIGIN,
    "expectedOriginForCrossOrigin": origins.HTTP_ORIGIN
  },
].forEach(testObj => {
  promise_test(referrerPolicyFunctor(testObj.policy,
                                     NavigationDestination.SameOrigin,
                                     testObj.expectedOriginForSameOrigin),
               referrerPolicyTestString(testObj.policy,
                                        NavigationDestination.SameOrigin));

  promise_test(referrerPolicyFunctor(testObj.policy,
                                     NavigationDestination.CrossOrigin,
                                     testObj.expectedOriginForCrossOrigin),
               referrerPolicyTestString(testObj.policy,
                                        NavigationDestination.CrossOrigin));
});

