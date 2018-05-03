var primitives = {'undefined':undefined,
                  'null':null,
                  'true':true,
                  'false':false,
                  'string, empty string':'',
                  'string, lone high surrogate':'\uD800',
                  'string, lone low surrogate':'\uDC00',
                  'string, NUL':'\u0000',
                  'string, astral character':'\uDBFF\uDFFD',
                  'number, 0.2':0.2,
                  'number, 0':0,
                  'number, -0':-0,
                  'number, NaN':NaN,
                  'number, Infinity':Infinity,
                  'number, -Infinity':-Infinity,
                  'number, 9007199254740992':9007199254740992,
                  'number, -9007199254740992':-9007199254740992,
                  'number, 9007199254740994':9007199254740994,
                  'number, -9007199254740994':-9007199254740994};

for (const [key, value] of Object.entries(primitives)) {
  check(`primitive ${key}`, value, compare_primitive);
}
check('Array primitives', Object.values(primitives), compare_Array(enumerate_props(compare_primitive)));
check('Object primitives', primitives, compare_Object(enumerate_props(compare_primitive)));
