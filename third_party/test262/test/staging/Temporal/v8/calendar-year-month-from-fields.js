// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-year-month-from-fields test
  in V8's mjsunit test calendar-year-month-from-fields.js
features: [Temporal]
---*/

assert.throws(TypeError, () => Temporal.PlainYearMonth.from());
[
  undefined,
  true,
  false,
  123,
  456n,
  Symbol(),
].forEach(function (fields) {
  assert.throws(TypeError, () => Temporal.PlainYearMonth.from(fields));
  assert.throws(TypeError, () => Temporal.PlainYearMonth.from(fields, undefined));
  assert.throws(TypeError, () => Temporal.PlainYearMonth.from(fields, { overflow: 'constrain' }));
  assert.throws(TypeError, () => Temporal.PlainYearMonth.from(fields, { overflow: 'reject' }));
});
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string'));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', undefined));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', { overflow: 'constrain' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', { overflow: 'reject' }));
assert.throws(TypeError, () => Temporal.PlainYearMonth.from({ month: 1 }));
assert.throws(TypeError, () => Temporal.PlainYearMonth.from({ year: 2021 }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'm1'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M1'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'm01'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 12,
  monthCode: 'M11'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M00'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M19'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M99'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M13'
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: -1
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: -Infinity
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 0,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 13,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M00'
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M13'
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 0
}));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 7
}, { overflow: 'invalid' }));
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 7
}).toJSON(), '2021-07');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 12
}).toJSON(), '2021-12');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M07'
}).toJSON(), '2021-07');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M12'
}).toJSON(), '2021-12');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 1
}).toJSON(), '2021-01');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 2
}).toJSON(), '2021-02');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 3
}).toJSON(), '2021-03');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 4
}).toJSON(), '2021-04');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 5
}).toJSON(), '2021-05');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 6
}).toJSON(), '2021-06');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 7
}).toJSON(), '2021-07');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 8
}).toJSON(), '2021-08');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 9
}).toJSON(), '2021-09');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 10
}).toJSON(), '2021-10');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 11
}).toJSON(), '2021-11');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 12
}).toJSON(), '2021-12');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 13
}).toJSON(), '2021-12');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  month: 999999
}).toJSON(), '2021-12');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M01'
}).toJSON(), '2021-01');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M02'
}).toJSON(), '2021-02');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M03'
}).toJSON(), '2021-03');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M04'
}).toJSON(), '2021-04');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M05'
}).toJSON(), '2021-05');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M06'
}).toJSON(), '2021-06');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M07'
}).toJSON(), '2021-07');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M08'
}).toJSON(), '2021-08');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M09'
}).toJSON(), '2021-09');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M10'
}).toJSON(), '2021-10');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M11'
}).toJSON(), '2021-11');
assert.sameValue(Temporal.PlainYearMonth.from({
  year: 2021,
  monthCode: 'M12'
}).toJSON(), '2021-12');
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 13
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainYearMonth.from({
  year: 2021,
  month: 9995
}, { overflow: 'reject' }));
