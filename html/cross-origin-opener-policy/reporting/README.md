== Existing tests ==

- access-reporting
  - access-from-coop-page-to-openee_coop-ro.https.html
    - COOP reports are to the opener when the opener used COOP-RO+COEP and then it tries to access a same-origin openee.
  - access-from-coop-page-to-openee_coop-ro_cross-origin.https.html
    - COOP reports are to the opener when the opener used COOP-RO+COEP and then it
  tries to access a cross-origin openee.
  - access-from-coop-page-to-opener_coop-ro.https.html
    - COOP reports are sent when the openee used COOP-RO+COEP and then tries to access its same-origin opener.
  - access-from-coop-page-to-opener_coop-ro_cross-origin.https.html
    - COOP reports are sent when the openee used COOP-RO+COEP and then tries to access its cross-origin opener.
  - access-from-coop-page-to-other_coop-ro.https.html
    - One window accesses a second one. They are aren't related by an opener/openee relationship. The first window has set Cross-Origin-Opener-Policy-Report-Only:same-origin, so it receives a "access-from-coop-page-to-other" report.
  - access-from-coop-page-to-other_coop-ro_cross-origin.https.html
    - One window accesses a second one. They are aren't related by an opener/openee relationship. The first window has set Cross-Origin-Opener-Policy-Report-Only:same-origin, so it receives a "access-from-coop-page-to-other" report.
  - access-to-coop-page-from-openee_coop-ro.https.html
    - COOP reports are to the opener when the opener used COOP-RO+COEP and then its
  same-origin openee tries to access it.
  - access-to-coop-page-from-openee_coop-ro_cross-origin.https.html
    - COOP reports are to the opener when the opener used COOP-RO+COEP and then its
  cross-origin openee tries to access it.
  - access-to-coop-page-from-opener_coop-ro.https.html
    - COOP reports are sent when the openee used COOP-RO+COEP and then its
  same-origin opener tries to access it.
  - access-to-coop-page-from-opener_coop-ro_cross-origin.https.html
    - COOP reports are sent when the openee used COOP-RO+COEP and then its
  cross-origin opener tries to access it.
  - access-to-coop-page-from-other_coop-ro.https.html
    - One window accesses a second one. They are aren't related by an opener/openee relationship. The second window has set Cross-Origin-Opener-Policy-Report-Only:same-origin, so it receives a "access-to-coop-page-from-other" report.
  - access-to-coop-page-from-other_coop-ro_cross-origin.https.html
    - One window accesses a second one. They are aren't related by an opener/openee relationship. The second window has set Cross-Origin-Opener-Policy-Report-Only:same-origin, so it receives a "access-to-coop-page-from-other" report.
  - property-blur.https.html
    - Check openee.blur() access is checked
  - property-close.https.html
    - Check openee.close() access is checked
  - property-closed.https.html
    - Check openee.closed access is checked
  - property-focus.https.html
    - Check openee.focus() access is checked
  - property-frames.https.html
    - Check openee.frames access is checked
  - property-indexed-getter.https.html
    - Check reports are sent for the indexed getter
  - property-length.https.html
    - Check openee.length access is checked
  - property-location-get.https.html
    - Check openee.location access is checked
  - property-location-set.https.html
    - Check openee.location access is checked (TODO rename title)
  - property-named-getter.https.html
    - Check reports are sent for the indexed getter
  - property-opener-get.https.html
    - Check openee.opener access is checked
  - property-opener-set.https.html
    - Check openee.opener access is checked (TODO rename title)
  - property-postmessage-1.https.html
    - Check openee.postMessage(arg1, arg2) access is checked
  - property-postmessage-2.https.html
    - Check openee.postMessage(arg1) access is checked
  - property-self.https.html
    - Check openee.self access is checked
  - property-top.https.html
    - Check openee.top access is checked
  - property-window.https.html
    - Check openee.window access is checked
  - report-to-both_coop-ro.https.html
    - Both the openee and the opener have a COOP reporter. The report are sent to both side.
  - reporting-observer.
    - Check the ReportingObserver(s) are notified about the coop-access-violation events.
- navigation-reporting
  - report-only-four-reports.https.html
    - A test with both COOP and COOP report only setup
  - report-only-from-unsafe-none.https.html
    - Report only tests for an opener without any COOP/COOP report only set
  - report-only-same-origin-report-to.https.html
    - reporting same origin with report-to
  - report-only-same-origin-with-coep-report-only.https.html
    - reporting same origin with report-to (TODO fix title?)
  - report-only-same-origin-with-coep.https.html
    - reporting same origin with report-to
  - report-only-same-origin.https.html
    - reporting same origin with report-to
  - reporting-coop-navigated-opener.https.html
    - Reports a browsing context group switch when an opener with COOP navigates.
  - reporting-coop-navigated-popup.https.html
    - Cross-Origin-Opener-Policy: a navigated popup with reporting
  - reporting-popup-same-origin-allow-popups-report-to.https.html
    - reporting same origin with report-to
  - reporting-popup-same-origin-coep-report-to.https.html
    - reporting same origin with report-to (TODO fix title?)
  - reporting-popup-same-origin-report-to.https.html
    - reporting same origin with report-to (TODO fix title?)
  - reporting-popup-same-origin.https.html
    - reporting same origin
  - reporting-popup-unsafe-none-report-to.https.html
    - reporting same origin with report-to
  - reporting-redirect-with-same-origin-allow-popups.https.html
    - Tests the redirect interaction with COOP same-origin-allow-popups.

== Testing plan ==



- access-reporting
  - Test all members of Window with testAccessProperty: https://html.spec.whatwg.org/#the-window-object
- navigation-reporting
  - report-only-same-origin-with-coep.https.html is identical to report-only-same-origin-with-coep-report-only.https.html


Per spec:

https://w3c.github.io/reporting/#generic-reporting

- test that the `content-type` request header is application/reports+json
- test that the HTTP method is POST

https://w3c.github.io/reporting/#try-delivery

- check the 'Origin' request header
- spec bug? where does it set the method to POST?

https://w3c.github.io/reporting/#queue-report

- change the value of navigator.userAgent, check that the original value is reported
- test that report destination URL's username/password, fragment are stripped
- test a URL that doesn't parse
- test javascript: mailto: data: ws: wss: etc URLs
- test settings objects

https://w3c.github.io/reporting/#notify-observers

- test report buffer > 100 reports

https://w3c.github.io/reporting/#add-report

- test that the right report types are visible or not visible to ReportingObserver
- test `options` with a `types` member that throws on getting
- test `options` with an empty (?) `types` member. (spec bug? what does empty mean?)
- "queue a task" - which task queue? (spec bug?)
- "how to polymorphically initialize body?" (spec bug?) - help solve this spec issue and test it.
- "Let global be observer’s relevant global object." - test that the right global object is used.

https://w3c.github.io/reporting/#interface-reporting-observer

- Check if this API is well-tested (TODO). (idlharness.js)
- Test unpaired UTF-16 surrogates where possible.
- Is `Report` web compatible? In chromium it's marked `LegacyNoInterfaceObject` https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/frame/report.idl (also see spec issue https://github.com/w3c/reporting/issues/216)

https://w3c.github.io/reporting/#disable

- "User agents MUST allow users to disable reporting with some reasonable amount of granularity in order to maintain the priority of constituencies espoused in [HTML-DESIGN-PRINCIPLES]." - manual test



General todos/bugs:

- Add <!doctype html> to all tests
- Add meta charset to all tests
- Make sure titles are unique
