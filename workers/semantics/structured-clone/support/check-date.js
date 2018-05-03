function compare_Date(actual, input, test_obj) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_true(actual instanceof Date, 'instanceof Date');
  assert_equals(Number(actual), Number(input), 'converted to primitive');
  assert_not_equals(actual, input);
  if (test_obj)
    test_obj.done();
}

check('Date 0', new Date(0), compare_Date);
check('Date -0', new Date(-0), compare_Date);
check('Date -8.64e15', new Date(-8.64e15), compare_Date);
check('Date 8.64e15', new Date(8.64e15), compare_Date);
check('Array Date objects', [new Date(0),
                             new Date(-0),
                             new Date(-8.64e15),
                             new Date(8.64e15)], compare_Array(enumerate_props(compare_Date)));
check('Object Date objects', {'0':new Date(0),
                              '-0':new Date(-0),
                              '-8.64e15':new Date(-8.64e15),
                              '8.64e15':new Date(8.64e15)}, compare_Object(enumerate_props(compare_Date)));
