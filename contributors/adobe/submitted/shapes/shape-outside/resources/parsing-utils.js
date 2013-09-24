var ParsingUtils = (function() {
function testInlineStyle(value, expected) {
    var div = document.createElement('div');
    div.style.setProperty('shape-outside', value);
    var actual = div.style.getPropertyValue('shape-outside');
    assert_equals(actual, typeof expected !== 'undefined' ? expected : value);
}

function testComputedStyle(value, expected, props) {
    var div = document.createElement('div');
    div.style.setProperty('shape-outside', value);
    if (props)
        for (key in props)
            div.style.setProperty(key, props[key]);
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

var validPositions = [
"left",
"center",
"right",
"top",
"bottom",
"50%",
"50px",

"left top",
"top left",
"left 50%",
"left 50px",
"50% top",
"50% 50%",
"50% 50px",
"50px top",
"50px 50%",
"50px 50px",

"center top 50%",
"center top 50px",
"left 50% center",
"left 50px center",
"left 50% top 50%",
"left 50% top 50px",
"left 50px top 50%",
"left 50px top 50px",

"top 50% center",
"top 50px center",
"center left 50%",
"center left 50px",
"top 50% left 50%",
"top 50px left 50%",
"top 50% left 50px",
"top 50px left 50px"
];

return {
    testInlineStyle: testInlineStyle,
    testComputedStyle: testComputedStyle,
    validPositions: validPositions,
    valuesAsArrays: valuesAsArrays
}
})();
