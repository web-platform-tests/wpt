check('String empty string', new String(''), compare_obj('String'));
check('String lone high surrogate', new String('\uD800'), compare_obj('String'));
check('String lone low surrogate', new String('\uDC00'), compare_obj('String'));
check('String NUL', new String('\u0000'), compare_obj('String'));
check('String astral character', new String('\uDBFF\uDFFD'), compare_obj('String'));
check('Array String objects', [new String(''),
                               new String('\uD800'),
                               new String('\uDC00'),
                               new String('\u0000'),
                               new String('\uDBFF\uDFFD')], compare_Array(enumerate_props(compare_obj('String'))));
check('Object String objects', {'empty':new String(''),
                               'high surrogate':new String('\uD800'),
                               'low surrogate':new String('\uDC00'),
                               'nul':new String('\u0000'),
                               'astral':new String('\uDBFF\uDFFD')}, compare_Object(enumerate_props(compare_obj('String'))));
