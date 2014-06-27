function _valToString(val)
{
    if (val === undefined || val === null)
        return '[' + typeof(val) + ']';
    return val.toString() + '[' + typeof(val) + ']';
}

function _assert(cond, text)
{
    assert_true(!!cond, text);
}

function _assertSame(a, b, text_a, text_b)
{
    var msg = text_a + ' === ' + text_b + ' (got ' + _valToString(a) +
              ', expected ' + _valToString(b) + ')';
    assert_equals(a, b, msg);
}

function _assertDifferent(a, b, text_a, text_b)
{
    var msg = text_a + ' !== ' + text_b + ' (got ' + _valToString(a) +
              ', expected not ' + _valToString(b) + ')';
    assert_not_equals(a, b, msg);
}

function _assertMatch(a, b, text_a, text_b)
{
    var msg = text_a + ' matches ' + text_b + ' (got ' + _valToString(a) + ')';
    assert_true(a.match(b), msg);
}


function _getPixel(canvas, x,y)
{
    var ctx = canvas.getContext('2d');
    var imgdata = ctx.getImageData(x, y, 1, 1);
    return [ imgdata.data[0], imgdata.data[1], imgdata.data[2], imgdata.data[3] ];
}

function _assertPixel(canvas, x,y, r,g,b,a, pos, colour)
{
    var c = _getPixel(canvas, x,y);
    var msg = 'got pixel [' + c + '] at ('+x+','+y+'), ' +
              'expected ['+r+','+g+','+b+','+a+']';
    assert_true(!c || (c[0] == r && c[1] == g && c[2] == b && c[3] == a), msg);
}

function _assertPixelApprox(canvas, x,y, r,g,b,a, pos, colour, tolerance)
{
    var c = _getPixel(canvas, x,y);
    var msg = 'got pixel [' + c + '] at ('+x+','+y+'), ' +
              'expected ['+r+','+g+','+b+','+a+'] +/- ' + tolerance;
    assert_true(!c || Math.max(Math.abs(c[0]-r), Math.abs(c[1]-g), Math.abs(c[2]-b), Math.abs(c[3]-a)) <= tolerance,
                msg);
}

function _addTest(testFn)
{
    var deferred = false;
    window.deferTest = function () { deferred = true; };
    on_event(window, "load", function()
    {
        t.step(function() {
            var canvas = document.getElementById('c');
            var ctx = canvas.getContext('2d');
            t.step(testFn, window, canvas, ctx);
        });

        if (!deferred) {
            t.done();
        }
    });
}

function _assertGreen(ctx, canvasWidth, canvasHeight)
{
    var testColor = function(d, idx, expected) {
        assert_equals(d[idx], expected, "d[" + idx + "]", String(expected));
    };
    var imagedata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var w = imagedata.width, h = imagedata.height, d = imagedata.data;
    for (var i = 0; i < h; ++i) {
        for (var j = 0; j < w; ++j) {
            testColor(d, 4 * (w * i + j) + 0, 0);
            testColor(d, 4 * (w * i + j) + 1, 255);
            testColor(d, 4 * (w * i + j) + 2, 0);
            testColor(d, 4 * (w * i + j) + 3, 255);
        }
    }
}
