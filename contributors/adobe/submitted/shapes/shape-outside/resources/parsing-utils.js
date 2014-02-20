var ParsingUtils = (function() {
function testInlineStyle(value, expected) {
    var div = document.createElement('div');
    div.style.setProperty('shape-outside', value);
    var actual = div.style.getPropertyValue('shape-outside');
    assert_equals(actual, expected);
}

function testComputedStyle(value, expected) {
    var div = document.createElement('div');
    div.style.setProperty('shape-outside', value);
    document.body.appendChild(div);
    var style = getComputedStyle(div);
    var actual = style.getPropertyValue('shape-outside');
    document.body.removeChild(div);
    assert_equals(actual, typeof expected !== 'undefined' ? expected : value);
}

function buildTestCases(testCases, type, testValueIdx) {
    var results = [];
    testCases.forEach(function(test) {
        if(Object.prototype.toString.call( test ) === '[object Array]') {
            if(test.length == 2) {
                testValue = test[testValueIdx];
                if(testValueIdx == 0)
                    // use the test case as the test name
                    test.unshift(testValue);
                else
                    // otherwise, assume the expected is the actual
                    test.push(testValue);
            }
            results.push(test);
        } else {
            var testCase = Array.apply(null, Array(2)).map(String.prototype.valueOf, test);
            if(type == "invalid")
                // Invalid expected result is null
                testCase.push(null);
            else
                // Valid expected result is the value
                testCase.push(test);

            results.push(testCase);
        }
    });
    return results;
}

function buildEllipsoidTests(shape, valid, units, type) {
    var results = new Array();
    if(Object.prototype.toString.call( units ) === '[object Array]') {
        units.forEach(function(unit) {
            ellipsoidTests = buildEllipsoidTests(shape, valid, unit, "lengthUnit");
            results = results.concat(ellipsoidTests);
        });
    } else {
        if (valid) {
            validPositions.forEach(function(test) {
                var testCase = [], testName, actual, expected;
                // skip if this isn't explicitly testing length units
                if( !(type == 'lengthUnit' && test[0].indexOf("u1") == -1)) {
                    actual = shape + '(at ' + setUnit(test[0], units) +')';
                    expected = shape + '(at ' + setUnit(test[1], units) +')';
                    if (type == "lengthUnit")
                        testName = 'test unit: ' + units +' - '+ actual;
                    else
                        testName = (actual + ' serializes as ' + expected);
                    testCase.push(testName)
                    testCase.push(actual);
                    testCase.push(expected);
                    results.push(testCase);
                }
            });
        } else {
            invalidPositions.forEach(function(test) {
                var testValue = shape + '(at ' + setUnit(test, units) +')';
                testCase = new Array();
                testCase.push(testValue + ' is invalid');
                testCase.push(testValue);
                testCase.push(null);
                results.push(testCase);
            });
        }
    }
    return unique(results);
}

function buildInsetTests(unit1, unit2) {
    var results = new Array();
    if(Object.prototype.toString.call( unit1 ) === '[object Array]') {
        unit1.forEach(function(unit) {
            insetTests = buildInsetTests(unit, unit2);
            results = results.concat(insetTests);
        });
    } else {
        validInsets.forEach(function(test) {
            var testValue = 'inset(' + setUnit(test[1], unit1, unit2) +')';
            testCase = Array.apply(null, Array(2)).map(String.prototype.valueOf, testValue);
            testCase.unshift(setUnit(test[0], unit1, unit2));
            results.push(testCase);
        });
    }
    return unique(results);
}

function unique(tests) {
    var list = tests.concat();
    for(var i = 0; i< list.length; ++i) {
        for(var j = i+1; j < list.length; ++j) {
            if(list[i][0] === list[j][0])
                list.splice(j--, 1);
        }
    }
    return list;
}

function setUnit(str, unit1, unit2) {
    if(arguments.length == 2)
        return str.replace(new RegExp("u1", 'g'), unit1);
    else
        return str.replace(new RegExp("u1", 'g'), unit1).replace(new RegExp("u2", 'g'), unit2);
}

function generateInsetRoundCases(units) {
    var testUnit = units;
    var sizes = [
        '10' + units,
        '20' + units,
        '30' + units,
        '40' + units
    ];

    function insetRound(value) {
        return 'inset(10' +testUnit+ ' round ' + value + ')';
    }

    function serializedInsetRound(lhsValues, rhsValues) {
        if(!rhsValues)
            return 'inset(10' +testUnit+ ' round ' + lhsValues +')';
        else
            return 'inset(10' +testUnit+ ' round ' + lhsValues +' / '+ rhsValues +')';
    }

    var results = [], left, lhs, right, rhs;
    for (left = 1; left <= 4; left++) {
        lhs = sizes.slice(0, left).join(' ');
        results.push([insetRound(lhs), insetRound(lhs), serializedInsetRound(lhs, null)]);
        for (right = 1; right <= 4; right++) {
            rhs = sizes.slice(0, right).join(' ');
            if(lhs == rhs)
                results.push([insetRound(lhs + ' / ' + rhs), insetRound(lhs + ' / ' + rhs), serializedInsetRound(lhs, null)]);
            else
                results.push([insetRound(lhs + ' / ' + rhs), insetRound(lhs + ' / ' + rhs), serializedInsetRound(lhs, rhs)]);
        }
    }
    return results;
}

var validUnits = [
                    "cm","mm","in","pt","pc",  // Absolute length units (omitting px b/c we default to that in all tests)
                    "em","ex","ch","rem",      // Font relative length units
                    "vw","vh","vmin","vmax"    // Viewport percentage units
                 ]

/// [actual, expected]
var validPositions = [

/// [ percent ], [ length ], [ percent | percent ], [ percent | length ], [ length | percent ], [ length | length ]
    ["50%", "50% 50%"],
    ["50u1", "50u1 50%"],
    ["50% 50%", "50% 50%"],
    ["50% 50u1", "50% 50u1"],
    ["50u1 50%", "50u1 50%"],
    ["50u1 50u1", "50u1 50u1"],

///// [ keyword ], [ keyword keyword ] x 5 keywords
    ["left", "0% 50%"],
    ["top", "50% 0%"],
    ["right", "100% 50%"],
    ["bottom", "50% 100%"],
    ["center", "50% 50%"],

    ["left top", "0% 0%"],
    ["left bottom", "0% 100%"],
    ["left center", "0% 50%"],

    ["top left", "0% 0%"],
    ["top right", "100% 0%"],
    ["top center", "50% 0%"],

    ["right top", "100% 0%"],
    ["right bottom", "100% 100%"],
    ["right center", "100% 50%"],

    ["bottom left", "0% 100%"],
    ["bottom right", "100% 100%"],
    ["bottom center", "50% 100%"],

    ["center top", "50% 0%"],
    ["center left", "0% 50%"],
    ["center right", "100% 50%"],
    ["center bottom", "50% 100%"],
    ["center center", "50% 50%"],

////// [ keyword | percent ], [ keyword | length ], [ percent | keyword ], [ length | keyword ] x 5 keywords
    ["left 50%", "0% 50%"],
    ["left 50u1", "0% 50u1"],

    ["50% top", "50% 0%"],
    ["50u1 top", "50u1 0%"],

    ["right 80%", "100% 80%"],
    ["right 80u1", "100% 80u1"],

    ["70% bottom", "70% 100%"],
    ["70u1 bottom", "70px 100%"],

    ["center 60%", "50% 60%"],
    ["center 60u1", "50% 60u1"],
    ["60% center", "60% 50%"],
    ["60u1 center", "60u1 50%"],

////// [ keyword | keyword percent ], [ keyword | keyword length ] x 5 keywords
    ["center top 50%", "50% 50%"],
    ["center top 50u1", "50% 50u1"],
    ["center left 50%", "50% 50%"],
    ["center left 50u1", "50u1 50%"],
    ["center right 70%", "30% 50%"],
    ["center right 70u1", "right 70u1 top 50%"],
    ["center bottom 70%", "50% 30%"],
    ["center bottom 70u1", "left 50% bottom 70u1"],

    ["left top 50%", "0% 50%"],
    ["left top 50u1", "0% 50u1"],
    ["left bottom 70%", "0% 30%"],
    ["left bottom 70u1", "left 0% bottom 70u1"],

    ["top left 50%", "50% 0%"],
    ["top left 50u1", "left 50u1 top 0%"],
    ["top right 70%", "30% 0%"],
    ["top right 70u1", "right 70u1 top 0%"],

    ["bottom left 50%", "50% 100%"],
    ["bottom left 50u1", "50u1 100%"],
    ["bottom right 70%", "30% 100%"],
    ["bottom right 70u1", "right 70u1 top 100%"],

    ["right bottom 70%", "100% 30%"],
    ["right bottom 70u1", "left 100% bottom 70u1"],
    ["right top 50%", "100% 50%"],
    ["right top 50u1", "left 100% top 50u1"],

////// [ keyword percent | keyword], [ keyword length | keyword ] x 5 keywords
    ["left 50% center", "50% 50%"],
    ["left 50u1 center", "50u1 50%"],
    ["left 50% top", "50% 0%"],
    ["left 50u1 top", "50u1 0%"],
    ["left 50% bottom", "50% 100%"],
    ["left 50u1 bottom", "50u1 100%"],

    ["top 50% center", "50% 50%"],
    ["top 50u1 center", "left 50% top 50u1"],
    ["top 50% left", "0% 50%"],
    ["top 50u1 left", "left 0% top 50u1"],
    ["top 50% right", "100% 50%"],
    ["top 50u1 right", "left 100% top 50u1"],

    ["bottom 70% center", "50% 30%"],
    ["bottom 70u1 center", "left 50% bottom 70u1"],
    ["bottom 70% left", "0%, 30%"],
    ["bottom 70u1 left", "left 0% bottom 70u1"],
    ["bottom 70% right", "100% 30%"],
    ["bottom 70u1 right", "left 100% bottom 70u1"],

    ["right 80% center", "20% 50%"],
    ["right 80u1 center", "right 80u1 top 50%"],
    ["right 80% bottom", "20% 100%"],
    ["right 80u1 bottom", "right 80u1 top 100%"],
    ["right 80% top", "20% 0%"],
    ["right 80u1 top", "right 80u1 top 0%"],

////// [ keyword percent |  keyword percent], [ keyword percent |  keyword length],
////// [ keyword length | keyword length],  [ keyword length | keyword percent] x 5 keywords
    ["left 50% top 50%", "50% 50%"],
    ["left 50% top 50u1", "50% 50u1"],
    ["left 50% bottom 70%", "50% 30%"],
    ["left 50% bottom 70u1", "left 50% bottom 70u1"],
    ["left 50u1 top 50%", "50u1 50%"],
    ["left 50u1 top 50u1", "50u1 50u1"],
    ["left 50u1 bottom 70%", "50u1 30%"],
    ["left 50u1 bottom 70u1", "left 50u1 bottom 70u1"],

    ["top 50% left 50%", "50% 50%"],
    ["top 50% left 50u1", "50u1 50%"],
    ["top 50% right 80%", "20% 50%"],
    ["top 50% right 80u1", "right 80u1 top 50%"],
    ["top 50u1 left 50%", "50% 50u1"],
    ["top 50u1 left 50u1", "50u1 50u1"],
    ["top 50u1 right 80%", "20% 50u1"],
    ["top 50u1 right 80u1", "right 80u1 top 50u1"],

    ["bottom 70% left 50%", "50% 30%"],
    ["bottom 70% left 50u1", "50u1 30%"],
    ["bottom 70% right 80%", "20% 30%"],
    ["bottom 70% right 80u1", "right 80u1 top 30%"],
    ["bottom 70u1 left 50%", "left 50% bottom 70u1"],
    ["bottom 70u1 left 50u1", "left 50u1 bottom 70u1"],
    ["bottom 70u1 right 80%", "left 20% bottom 70u1"],
    ["bottom 70u1 right 80u1", "right 80u1 bottom 70u1"],

    ["right 80% top 50%", "20% 50%"],
    ["right 80% top 50u1", "20% 50u1"],
    ["right 80% bottom 70%", "20% 30%"],
    ["right 80% bottom 70u1", "left 20% bottom 70u1"],
    ["right 80u1 top 50%", "right 80u1 top 50%"],
    ["right 80u1 top 50u1", "right 80u1 top 50u1"],
    ["right 80u1 bottom 70%", "right 80u1 top 30%"],
    ["right 80u1 bottom 70u1", "right 80u1 bottom 70u1"],
];

var invalidPositions = [
////// [ keyword | percent ], [ keyword | length ], [ percent | keyword ], [ length | keyword ] x 5 keywords
    "50% left",
    "50px left",
    "top 50%",
    "80% right",
    "80px right",
    "bottom 70%",
    "bottom 70px",

//////  [ keyword | keyword percent ], [ keyword | keyword length ] x 5 keywords
    "center center 60%",
    "center center 60px",

    "left center 60%",
    "left center 60px",
    "left right 80%",
    "left right 80px",
    "left left 50%",
    "left left 50px",

    "top center 60%",
    "top center 60px",
    "top bottom 80%",
    "top bottom 80px",
    "top top 50%",
    "top top 50px",

    "bottom center 60%",
    "bottom center 60px",
    "bottom top 50%",
    "bottom top 50px",
    "bottom bottom 50%",
    "bottom bottom 50px",

    "right center 60%",
    "right center 60px",
    "right left 50%",
    "right left 50px",
    "right right 70%",
    "right right 70px",

////// [ keyword percent | keyword], [ keyword length | keyword ] x 5 keywords
    "center 60% top",
    "center 60px top",
    "center 60% bottom",
    "center 60px bottom",
    "center 60% left",
    "center 60px left",
    "center 60% right",
    "center 60px right",
    "center 60% center",
    "center 60px center",

    "left 50% right",
    "left 50px right",
    "left 50% left",
    "left 50px left",

    "top 50% bottom",
    "top 50px bottom",
    "top 50% top",
    "top 50px top",

    "bottom 70% top",
    "bottom 70px top",
    "bottom 70% bottom",
    "bottom 70px bottom",

    "right 80% left",
    "right 80px left",

////// [ keyword percent |  keyword percent], [ keyword percent |  keyword length],
////// [ keyword length | keyword length],  [ keyword length | keyword percent] x 5 keywords
    "center 60% top 50%",
    "center 60% top 50px",
    "center 60% bottom 70%",
    "center 60% bottom 70px",
    "center 60% left 50%",
    "center 60% left 50px",
    "center 60% right 70%",
    "center 60% right 70px",
    "center 60% center 65%",
    "center 60% center 65px",
    "center 60px top 50%",
    "center 60px top 50px",
    "center 60px bottom 70%",
    "center 60px bottom 70px",
    "center 60px left 50%",
    "center 60px left 50px",
    "center 60px right 70%",
    "center 60px right 70px",
    "center 60px center 65%",
    "center 60px center 65px",

    "left 50% center 60%",
    "left 50% center 60px",
    "left 50% right 80%",
    "left 50% right 80px",
    "left 50% left 50%",
    "left 50% left 50px",
    "left 50px center 60%",
    "left 50px center 60px",
    "left 50px right 80%",
    "left 50px right 80px",
    "left 50px left 50%",
    "left 50px left 50px",

    "top 50% center 60%",
    "top 50% center 60px",
    "top 50% bottom 50%",
    "top 50% bottom 50px",
    "top 50% top 50%",
    "top 50% top 50px",
    "top 50px center 60%",
    "top 50px center 60px",
    "top 50px bottom 70%",
    "top 50px bottom 70px",
    "top 50px top 50%",
    "top 50px top 50px",

    "bottom 70% center 60%",
    "bottom 70% center 60px",
    "bottom 70% top 50%",
    "bottom 70% top 50px",
    "bottom 70% bottom 50%",
    "bottom 70% bottom 50px",
    "bottom 70px center 60%",
    "bottom 70px center 60px",
    "bottom 70px top 50%",
    "bottom 70px top 50px",
    "bottom 70px bottom 50%",
    "bottom 70px bottom 50px",

    "right 80% center 60%",
    "right 80% center 60px",
    "right 80% left 50%",
    "right 80% left 50px",
    "right 80% right 85%",
    "right 80% right 85px",
    "right 80px center 60%",
    "right 80px center 60px",
    "right 80px left 50%",
    "right 80px left 50px",
    "right 80px right 85%",
    "right 80px right 85px"
];


 var validInsets = [
    ["One arg - u1", "10u1"],
    ["One arg - u2", "10u2"],
    ["Two args - u1 u1", "10u1 20u1"],
    ["Two args - u1 u2", "10u1 20u2"],
    ["Two args - u2 u1", "10u2 20u1"],
    ["Two args - u2 u2", "10u2 20u2"],
    ["Three args - u1 u1 u1", "10u1 20u1 30u1"],
    ["Three args - u1 u1 u2", "10u1 20u1 30u2"],
    ["Three args - u1 u2 u1", "10u1 20u2 30u1"],
    ["Three args - u1 u2 u2 ", "10u1 20u2 30u2"],
    ["Three args - u2 u1 u1", "10u2 20u1 30u1"],
    ["Three args - u2 u1 u2 ", "10u2 20u1 30u2"],
    ["Three args - u2 u2 u1 ", "10u2 20u2 30u1"],
    ["Three args - u2 u2 u2 ","10u2 20u2 30u2"],
    ["Four args - u1 u1 u1 u1", "10u1 20u1 30u1 40u1"],
    ["Four args - u1 u1 u1 u2", "10u1 20u1 30u1 40u2"],
    ["Four args - u1 u1 u2 u1", "10u1 20u1 30u2 40u1"],
    ["Four args - u1 u1 u2 u2", "10u1 20u1 30u2 40u2"],
    ["Four args - u1 u2 u1 u1", "10u1 20u2 30u1 40u1"],
    ["Four args - u1 u2 u1 u2", "10u1 20u2 30u1 40u2"],
    ["Four args - u1 u2 u2 u1", "10u1 20u2 30u2 40u1"],
    ["Four args - u1 u2 u2 u2", "10u1 20u2 30u2 40u2"],
    ["Four args - u2 u1 u1 u1", "10u2 20u1 30u1 40u1"],
    ["Four args - u2 u1 u1 u2", "10u2 20u1 30u1 40u2"],
    ["Four args - u2 u1 u2 u1", "10u2 20u1 30u2 40u1"],
    ["Four args - u2 u1 u2 u2", "10u2 20u1 30u2 40u2"],
    ["Four args - u2 u2 u1 u1", "10u2 20u2 30u1 40u1"],
    ["Four args - u2 u2 u1 u2", "10u2 20u2 30u1 40u2"],
    ["Four args - u2 u2 u2 u1", "10u2 20u2 30u2 40u1"],
    ["Four args - u2 u2 u2 u2", "10u2 20u2 30u2 40u2"]
]

return {
    testInlineStyle: testInlineStyle,
    testComputedStyle: testComputedStyle,
    buildTestCases: buildTestCases,
    buildEllipsoidTests: buildEllipsoidTests,
    buildInsetTests: buildInsetTests,
    generateInsetRoundCases: generateInsetRoundCases,
    validUnits: validUnits
}
})();
