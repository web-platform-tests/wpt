// Test what happens when navigating current page to a javascript: URL when
// clicking an anchor element, and transmit the information back to the opener.
// @param reportOnly whether the CSP rule for this page is "report-only" rather
//   than "enforce"
// The following query strings are considered:
//   - "defaultpolicy": a string indicating the default policy that will be
//      created before setting the location.
//      - "replace": Default policy replaces "continue" with
//        "defaultpolicywashere".
//      - "throw": Default policy throws an exception.
//      - "make-invalid": Default policy returns an invalid URL.
//   - "navigationattempted": whether the page was already navigated once.
//   - "frame": whether the navigation target is "frame" rather than "_self".
//   - "form-submission": navigate via a <input type="button"> element rather
//      than an <a> element.
function navigateToJavascriptURL(reportOnly) {
    const params = new URLSearchParams(location.search);

    if (!!params.get("defaultpolicy")) {
        trustedTypes.createPolicy("default", {
            createScript: s => {
                switch (params.get("defaultpolicy")) {
                    case "replace":
                        return s.replace("continue", "defaultpolicywashere");
                    case "throw":
                        throw new Error("Exception in createScript()");
                    case "make-invalid":
                        return "//make:invalid/";
                }
            },
        });
    }

    function bounceEventToOpener(e) {
        const msg = {};
        for (const field of ["effectiveDirective", "sample", "type"]) {
            msg[field] = e[field];
        }

        msg["uri"] = location.href;
        window.opener.postMessage(msg, "*");
    }

    // If a navigation is blocked by Trusted Types, we expect this window to
    // throw a SecurityPolicyViolationEvent. If it's not blocked, we expect the
    // loaded frame to through DOMContentLoaded. In either case there should be
    // _some_ event that we can expect.
    document.addEventListener("DOMContentLoaded", bounceEventToOpener);
    // Prevent loops.
    if (params.has("navigationattempted")) {
      return;
    }

    let url = new URL(
      reportOnly ?
      // Navigate to the non-report-only version of the test. That has the same
      // event listening setup as this, but is a different target URI.
      location.href.replace("-report-only", "") :
      // We'll use a javascript:-url to navigate to ourselves, so that we can
      // re-use the messageing mechanisms above.
      location.href
    );
    url.searchParams.set("navigationattempted", 1);
    url.searchParams.set("continue", 1);
    let target_script = `location.href='${url.toString()}';`;

    function getAndPreparareNavigationElement(javaScriptURL) {
        let target = "_self";
        if (!!params.get("frame")) {
            const frame = document.createElement("iframe");
            frame.src = "frame-without-trusted-types.html";
            frames.name = "frame";
            document.body.appendChild(frame);
            target = "frame";
        }

        if (!!params.get("form-submission")) {
            const submit = document.getElementById("submit");

            // Careful, the IDL attributes are defined in camel-case.
            submit.formAction = javaScriptURL;
            submit.formTarget = target;

            return submit;
        }

        const anchor = document.getElementById("anchor");
        anchor.href = javaScriptURL;
        anchor.target = target;
        return anchor;
    }

    const navigationElement = getAndPreparareNavigationElement(`javascript:${target_script}`);
    document.addEventListener("DOMContentLoaded", async _ => {
      let {violations, exception} =
        await trusted_type_violations_and_exception_for(_ => navigationElement.click());
      violations.forEach(violationEvent => bounceEventToOpener(violationEvent));
      if (violations.length == 0 &&
          [null, "throw", "make-invalid"].includes(params.get("defaultpolicy"))) {
        window.opener.postMessage("No securitypolicyviolation reported!", "*");
      }
    });
}
