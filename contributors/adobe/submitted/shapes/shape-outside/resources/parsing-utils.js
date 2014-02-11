var ParsingUtils = (function() {
function testInlineStyle(value, expected) {
    var div = document.createElement('div');
    div.style.setProperty('shape-outside', value);
    var actual = div.style.getPropertyValue('shape-outside');
    assert_equals(actual, typeof expected !== 'undefined' ? expected : value);
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

function valuesAsArrays(values, length) {
    var result = [];
    values.forEach(function(value) {
        result.push(Array.apply(null, Array(length)).map(String.prototype.valueOf, value));
    });
    return result;
}

function buildEllipsesTests(shape, pairs) {
    var result = [];
    pairs.forEach(function(pair) {
        var testInfo = new Array();
        testInfo.push(shape + "(at " + pair[0] + ")");
        testInfo.push(shape + "(at " + pair[0] + ")");
        testInfo.push(shape + "(at " + pair[1] + ")");
        result.push(testInfo);
    });
    return result;
}

function buildInsetTests(pairs) {
    var result = [];
    pairs.forEach(function(pair) {
        var testInfo = new Array();
        if(pairs.length > 2)
            testInfo.push(pair[0]);
        else
            testInfo.push("inset(" + pair[1] + ")");
        testInfo.push("inset(" + pair[1] + ")");
        testInfo.push("inset(" + pair[2] + ")");
        result.push(testInfo);
    });
    return result;
}


var serializedEllipses = [
["left", "0% 50%"],
["center", "50% 50%"],
["right", "100% 50%"],
["top", "50% 0%"],
["bottom", "50% 100%"],
["50%", "50% 50%"],
["50px", "50px 50%"],

["left top", "0% 0%"],
["top left", "0% 0%"],
["left 50%", "0% 50%"],
["left 50px", "0% 50px"],
["50% top", "50% 0%"],
["50% 50%", "50% 50%"],
["50% 50px", "50% 50px"],
["50px top", "50px 0%"],
["50px 50%", "50px 50%"],
["50px 50px", "50px 50px"],

["center top 50%", "left 50% top 50%"],
["center top 50px", "left 50% top 50px"],
["left 50% center", "left 50% top 50%"],
["left 50px center", "left 50px top 50%"],
["left 50% top 50%", "left 50% top 50%"],
["left 50% top 50px", "left 50% top 50px"],
["left 50px top 50%", "left 50px top 50%"],
["left 50px top 50px", "left 50px top 50px"],

["top 50% center", "left 50% top 50%"],
["top 50px center", "left 50% top 50px"],
["center left 50%", "left 50% top 50%"],
["center left 50px", "left 50px top 50%"],
["top 50% left 50%", "left 50% top 50%"],
["top 50px left 50%", "left 50% top 50px"],
["top 50% left 50px", "left 50px top 50%"],
["top 50px left 50px", "left 50px top 50px"]
];

return {
    testInlineStyle: testInlineStyle,
    testComputedStyle: testComputedStyle,
    serializedEllipses: serializedEllipses,
    valuesAsArrays: valuesAsArrays,
    buildEllipsesTests: buildEllipsesTests,
    buildInsetTests: buildInsetTests
}
})();
