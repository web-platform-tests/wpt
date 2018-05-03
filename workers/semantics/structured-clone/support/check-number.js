check('Number 0.2', new Number(0.2), compare_obj('Number'));
check('Number 0', new Number(0), compare_obj('Number'));
check('Number -0', new Number(-0), compare_obj('Number'));
check('Number NaN', new Number(NaN), compare_obj('Number'));
check('Number Infinity', new Number(Infinity), compare_obj('Number'));
check('Number -Infinity', new Number(-Infinity), compare_obj('Number'));
check('Number 9007199254740992', new Number(9007199254740992), compare_obj('Number'));
check('Number -9007199254740992', new Number(-9007199254740992), compare_obj('Number'));
check('Number 9007199254740994', new Number(9007199254740994), compare_obj('Number'));
check('Number -9007199254740994', new Number(-9007199254740994), compare_obj('Number'));
check('Array Number objects', [new Number(0.2),
                               new Number(0),
                               new Number(-0),
                               new Number(NaN),
                               new Number(Infinity),
                               new Number(-Infinity),
                               new Number(9007199254740992),
                               new Number(-9007199254740992),
                               new Number(9007199254740994),
                               new Number(-9007199254740994)], compare_Array(enumerate_props(compare_obj('Number'))));
check('Object Number objects', {'0.2':new Number(0.2),
                               '0':new Number(0),
                               '-0':new Number(-0),
                               'NaN':new Number(NaN),
                               'Infinity':new Number(Infinity),
                               '-Infinity':new Number(-Infinity),
                               '9007199254740992':new Number(9007199254740992),
                               '-9007199254740992':new Number(-9007199254740992),
                               '9007199254740994':new Number(9007199254740994),
                               '-9007199254740994':new Number(-9007199254740994)}, compare_Object(enumerate_props(compare_obj('Number'))));
