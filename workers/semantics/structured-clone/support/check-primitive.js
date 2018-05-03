check('primitive undefined', undefined, compare_primitive);
check('primitive null', null, compare_primitive);
check('primitive true', true, compare_primitive);
check('primitive false', false, compare_primitive);
check('primitive string, empty string', '', compare_primitive);
check('primitive string, lone high surrogate', '\uD800', compare_primitive);
check('primitive string, lone low surrogate', '\uDC00', compare_primitive);
check('primitive string, NUL', '\u0000', compare_primitive);
check('primitive string, astral character', '\uDBFF\uDFFD', compare_primitive);
check('primitive number, 0.2', 0.2, compare_primitive);
check('primitive number, 0', 0, compare_primitive);
check('primitive number, -0', -0, compare_primitive);
check('primitive number, NaN', NaN, compare_primitive);
check('primitive number, Infinity', Infinity, compare_primitive);
check('primitive number, -Infinity', -Infinity, compare_primitive);
check('primitive number, 9007199254740992', 9007199254740992, compare_primitive);
check('primitive number, -9007199254740992', -9007199254740992, compare_primitive);
check('primitive number, 9007199254740994', 9007199254740994, compare_primitive);
check('primitive number, -9007199254740994', -9007199254740994, compare_primitive);

check('Array primitives', [undefined,
                           null,
                           true,
                           false,
                           '',
                           '\uD800',
                           '\uDC00',
                           '\u0000',
                           '\uDBFF\uDFFD',
                           0.2,
                           0,
                           -0,
                           NaN,
                           Infinity,
                           -Infinity,
                           9007199254740992,
                           -9007199254740992,
                           9007199254740994,
                           -9007199254740994], compare_Array(enumerate_props(compare_primitive)));

check('Object primitives', {'undefined':undefined,
                           'null':null,
                           'true':true,
                           'false':false,
                           'empty':'',
                           'high surrogate':'\uD800',
                           'low surrogate':'\uDC00',
                           'nul':'\u0000',
                           'astral':'\uDBFF\uDFFD',
                           '0.2':0.2,
                           '0':0,
                           '-0':-0,
                           'NaN':NaN,
                           'Infinity':Infinity,
                           '-Infinity':-Infinity,
                           '9007199254740992':9007199254740992,
                           '-9007199254740992':-9007199254740992,
                           '9007199254740994':9007199254740994,
                           '-9007199254740994':-9007199254740994}, compare_Object(enumerate_props(compare_primitive)));
