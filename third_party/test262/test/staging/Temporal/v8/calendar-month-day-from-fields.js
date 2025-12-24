// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-month-day-from-fields test
  in V8's mjsunit test calendar-month-day-from-fields.js
features: [Temporal]
---*/

assert.throws(TypeError, () => Temporal.PlainMonthDay.from());
[
  undefined,
  true,
  false,
  123,
  456n,
  Symbol(),
].forEach(function (fields) {
  assert.throws(TypeError, () => Temporal.PlainMonthDay.from(fields));
  assert.throws(TypeError, () => Temporal.PlainMonthDay.from(fields, undefined));
  assert.throws(TypeError, () => Temporal.PlainMonthDay.from(fields, { overflow: 'constrain' }));
  assert.throws(TypeError, () => Temporal.PlainMonthDay.from(fields, { overflow: 'reject' }));
});
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string'));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', undefined));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', { overflow: 'constrain' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from('string', { overflow: 'reject' }));
assert.sameValue(Temporal.PlainMonthDay.from({
  month: 1,
  day: 17
}).toJSON(), '01-17');
assert.throws(TypeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  day: 17
}));
assert.throws(TypeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'm1',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M1',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'm01',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  monthCode: 'M11',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M00',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M19',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M99',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M13',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: -1,
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: -Infinity,
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: -17
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: -Infinity
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 0
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 1,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 2,
  day: 29
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 6,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 9,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 0,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 13,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M12',
  day: 0
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M12',
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M01',
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M06',
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M09',
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M00',
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M13',
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 0
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 0,
  day: 3
}));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: 13
}, { overflow: 'invalid' }));
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: 15
}).toJSON(), '07-15');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: 3
}).toJSON(), '07-03');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 31
}).toJSON(), '12-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M07',
  day: 15
}).toJSON(), '07-15');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M07',
  day: 3
}).toJSON(), '07-03');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M12',
  day: 31
}).toJSON(), '12-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M02',
  day: 29
}).toJSON(), '02-28');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 1,
  day: 133
}).toJSON(), '01-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 2,
  day: 133
}).toJSON(), '02-28');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 3,
  day: 9033
}).toJSON(), '03-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 4,
  day: 50
}).toJSON(), '04-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 5,
  day: 77
}).toJSON(), '05-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 6,
  day: 33
}).toJSON(), '06-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: 33
}).toJSON(), '07-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 8,
  day: 300
}).toJSON(), '08-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 9,
  day: 400
}).toJSON(), '09-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 10,
  day: 400
}).toJSON(), '10-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 11,
  day: 400
}).toJSON(), '11-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 500
}).toJSON(), '12-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 13,
  day: 500
}).toJSON(), '12-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  month: 999999,
  day: 500
}).toJSON(), '12-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M01',
  day: 133
}).toJSON(), '01-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M02',
  day: 133
}).toJSON(), '02-28');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M03',
  day: 9033
}).toJSON(), '03-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M04',
  day: 50
}).toJSON(), '04-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M05',
  day: 77
}).toJSON(), '05-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M06',
  day: 33
}).toJSON(), '06-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M07',
  day: 33
}).toJSON(), '07-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M08',
  day: 300
}).toJSON(), '08-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M09',
  day: 400
}).toJSON(), '09-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M10',
  day: 400
}).toJSON(), '10-31');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M11',
  day: 400
}).toJSON(), '11-30');
assert.sameValue(Temporal.PlainMonthDay.from({
  year: 2021,
  monthCode: 'M12',
  day: 500
}).toJSON(), '12-31');
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 1,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 2,
  day: 29
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 3,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 4,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 5,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 6,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 7,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 8,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 9,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 10,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 11,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainMonthDay.from({
  year: 2021,
  month: 13,
  day: 5
}, { overflow: 'reject' }));
