const kNavigationAttempted = "navigationattempted=1";

function navigateToJavascriptURL(reportOnly) {
    const params = new URLSearchParams(location.search);
    if (!!params.get("defaultpolicy")) {
      trustedTypes.createPolicy("default", {
          createScript: s => s.replace("continue", "defaultpolicywashere"),
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
    document.addEventListener("securitypolicyviolation", bounceEventToOpener);

    let target_script;
    if (reportOnly) {
        // Navigate to the non-report-only version of the test. That has the same
        // event listening setup as this, but is a different target URI.
        target_script = `location.href='${location.href.replace("-report-only", "") +
            (location.href.includes("?") ? "&" : "?") + kNavigationAttempted + "&continue"}';`;
    } else {
        // We'll use a javascript:-url to navigate to ourselves, so that we can
        // re-use the messageing mechanisms above.
        target_script = `location.href='${location.href + "&" + kNavigationAttempted}&continue';`;
    }
    const target = `javascript:${target_script}`;

    const anchor = document.getElementById("anchor");
    anchor.href = target;

    if (!!params.get("frame")) {
      const frame = document.createElement("iframe");
      frame.src = "frame-without-trusted-types.html";
      frames.name = "frame";
      document.body.appendChild(frame);
      anchor.target = "frame";
    }

    // Prevent loops.
    if (!location.search.includes(kNavigationAttempted)) {
      document.addEventListener("DOMContentLoaded", _ => anchor.click());
    }
}
