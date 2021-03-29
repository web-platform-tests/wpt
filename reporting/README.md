## Testing plan ##

### Reporting API ###

https://w3c.github.io/reporting/#generic-reporting

- test that the `content-type` request header is application/reports+json
- test that the HTTP method is POST

https://w3c.github.io/reporting/#try-delivery

- check the 'Origin' request header

https://w3c.github.io/reporting/#queue-report

- change the value of navigator.userAgent, check that the original value is reported
- test that report destination URL's username/password, fragment are stripped
- test a URL that doesn't parse
- test javascript: mailto: data: ws: wss: etc URLs
- test settings objects

https://w3c.github.io/reporting/#notify-observers

- test report buffer > 100 reports
  tests: bufferSize.html

https://w3c.github.io/reporting/#add-report

- test that the right report types are visible or not visible to ReportingObserver
- test `options` with a `types` member that throws on getting
- test `options` with an empty (?) `types` member. (spec bug? what does empty mean?)
- "queue a task" - which task queue? (spec bug?)
- "how to polymorphically initialize body?" (spec bug?) - help solve this spec issue and test it.
- "Let global be observer’s relevant global object." - test that the right global object is used.

https://w3c.github.io/reporting/#interface-reporting-observer

- Check if this API is well-tested (TODO).
  tests: idlharness.any.js
- Test unpaired UTF-16 surrogates where possible.
- Is `Report` web compatible? In chromium it's marked `LegacyNoInterfaceObject` https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/frame/report.idl (also see spec issue https://github.com/w3c/reporting/issues/216)

https://w3c.github.io/reporting/#disable

- "User agents MUST allow users to disable reporting with some reasonable amount of granularity in order to maintain the priority of constituencies espoused in [HTML-DESIGN-PRINCIPLES]." - manual test
