// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from plain-date-time-with-calendar test
  in V8's mjsunit test plain-date-time-with-calendar.js
includes: [temporalHelpers.js]
features: [Temporal]
---*/

let d1 = new Temporal.PlainDateTime(1911, 10, 10, 4, 5, 6, 7, 8, 9);
let badDateTime = { withCalendar: d1.withCalendar };
assert.throws(TypeError, () => badDateTime.withCalendar('iso8601'));

let d2 = d1.withCalendar('roc');
assert.sameValue('roc', d2.calendarId);
TemporalHelpers.assertPlainDateTime(d2, 0, 10, 'M10', 10, 4, 5, 6, 7, 8, 9, '', 'broc', 1);
let d3 = d2.withCalendar('iso8601');
assert.sameValue('iso8601', d3.calendarId);
TemporalHelpers.assertPlainDateTime(d3, 1911, 10, 'M10', 10, 4, 5, 6, 7, 8, 9);
