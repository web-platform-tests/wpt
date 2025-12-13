// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: pending
description: >
  Automatically ported from calendar-date-from-fields test
  in V8's mjsunit test calendar-date-from-fields.js
features: [Temporal]
---*/

assert.throws(TypeError, () => Temporal.PlainDate.from());
[
  undefined,
  true,
  false,
  123,
  456n,
  Symbol(),
  123.456,
  NaN,
  null
].forEach(function (fields) {
  assert.throws(TypeError, () => Temporal.PlainDate.from(fields));
  assert.throws(TypeError, () => Temporal.PlainDate.from(fields, undefined));
  assert.throws(TypeError, () => Temporal.PlainDate.from(fields, { overflow: 'constrain' }));
  assert.throws(TypeError, () => Temporal.PlainDate.from(fields, { overflow: 'reject' }));
});
assert.throws(RangeError, () => Temporal.PlainDate.from('string'));
assert.throws(RangeError, () => Temporal.PlainDate.from('string', undefined));
assert.throws(RangeError, () => Temporal.PlainDate.from('string', { overflow: 'constrain' }));
assert.throws(RangeError, () => Temporal.PlainDate.from('string', { overflow: 'reject' }));
assert.throws(TypeError, () => Temporal.PlainDate.from({
  month: 1,
  day: 17
}));
assert.throws(TypeError, () => Temporal.PlainDate.from({
  year: 2021,
  day: 17
}));
assert.throws(TypeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'm1',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M1',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'm01',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  monthCode: 'M11',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M00',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M19',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M99',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M13',
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: -1,
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: -Infinity,
  day: 17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: -17
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: -Infinity
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 0
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 1,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 2,
  day: 29
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 6,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 9,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 0,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 13,
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M12',
  day: 0
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M12',
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M01',
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M02',
  day: 29
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M06',
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M09',
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M00',
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M13',
  day: 5
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 0
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 0,
  day: 3
}));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: 13
}, { overflow: 'invalid' }));
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: 15
}).toJSON(), '2021-07-15');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: 3
}).toJSON(), '2021-07-03');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 31
}).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M07',
  day: 15
}).toJSON(), '2021-07-15');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M07',
  day: 3
}).toJSON(), '2021-07-03');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M12',
  day: 31
}).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 1,
  day: 133
}).toJSON(), '2021-01-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 2,
  day: 133
}).toJSON(), '2021-02-28');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 3,
  day: 9033
}).toJSON(), '2021-03-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 4,
  day: 50
}).toJSON(), '2021-04-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 5,
  day: 77
}).toJSON(), '2021-05-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 6,
  day: 33
}).toJSON(), '2021-06-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: 33
}).toJSON(), '2021-07-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 8,
  day: 300
}).toJSON(), '2021-08-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 9,
  day: 400
}).toJSON(), '2021-09-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 10,
  day: 400
}).toJSON(), '2021-10-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 11,
  day: 400
}).toJSON(), '2021-11-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 500
}).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 13,
  day: 500
}).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  month: 999999,
  day: 500
}).toJSON(), '2021-12-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M01',
  day: 133
}).toJSON(), '2021-01-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M02',
  day: 133
}).toJSON(), '2021-02-28');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M03',
  day: 9033
}).toJSON(), '2021-03-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M04',
  day: 50
}).toJSON(), '2021-04-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M05',
  day: 77
}).toJSON(), '2021-05-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M06',
  day: 33
}).toJSON(), '2021-06-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M07',
  day: 33
}).toJSON(), '2021-07-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M08',
  day: 300
}).toJSON(), '2021-08-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M09',
  day: 400
}).toJSON(), '2021-09-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M10',
  day: 400
}).toJSON(), '2021-10-31');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M11',
  day: 400
}).toJSON(), '2021-11-30');
assert.sameValue(Temporal.PlainDate.from({
  year: 2021,
  monthCode: 'M12',
  day: 500
}).toJSON(), '2021-12-31');
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 1,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 2,
  day: 29
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 3,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 4,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 5,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 6,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 7,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 8,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 9,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 10,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 11,
  day: 31
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 12,
  day: 32
}, { overflow: 'reject' }));
assert.throws(RangeError, () => Temporal.PlainDate.from({
  year: 2021,
  month: 13,
  day: 5
}, { overflow: 'reject' }));
