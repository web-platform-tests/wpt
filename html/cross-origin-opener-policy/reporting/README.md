## Existing tests ##

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

## Testing plan ##



- access-reporting
  - Test all members of Window with testAccessProperty? https://html.spec.whatwg.org/#the-window-object ...or are these enough? https://whatpr.org/html/5518/895fd80...c8265a7/browsers.html#crossoriginproperties-(-o-)
- navigation-reporting
  - report-only-same-origin-with-coep.https.html is identical to report-only-same-origin-with-coep-report-only.https.html (but different .headers) -- could have clearer titles.



### HTML ###

https://whatpr.org/html/5518/895fd80...c8265a7/browsers.html#virtual-browsing-context-group-id

- How to test? (TODO) (Also "initial URL", "opener origin at creation")
  - window.open
  - iframe
  - https://whatpr.org/html/5518/895fd80...c8265a7/browsers.html#creating-a-new-auxiliary-browsing-context step 6, 7

https://whatpr.org/html/5518/895fd80...c8265a7/browsers.html#crossoriginproperties-(-o-)
- Property access for these should be tested already.

https://whatpr.org/html/5518/895fd80...c8265a7/browsing-the-web.html#navigate

- step 7...

https://whatpr.org/html/5518/895fd80...c8265a7/origin.html#the-headers

- update Structured Fields parsing tests

https://whatpr.org/html/5518/895fd80...c8265a7/origin.html#browsing-context-group-switches-due-to-cross-origin-opener-policy

- test same COOPRO with same-origin navigation, expect no report
- test initial about:blank (expect no report)
- test non-initial about:blank (expect report)
- test sandboxFlags
- test COOP+COOPRO with different  (expect report)
- test COOP+COOPRO with same values (expect no report)

https://whatpr.org/html/5518/895fd80...c8265a7/origin.html#reporting

- test step 2. Nested iframes: originA nests originB nests originA. The innermost iframe is accessor. (expect no report)
- test step 3. Come up with interesting cases where virtual browsing context group ID has unexpected values.
- ...

### General todos/bugs ###

- Make sure titles are unique
