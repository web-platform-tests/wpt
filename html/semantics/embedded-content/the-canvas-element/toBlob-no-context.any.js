promise_test(async function() {
    var canvas = document.createElement("canvas");
    var blob = await new Promise(resolve => canvas.toBlob(resolve));
    assert_equals(blob.type, "image/png");
}, "toBlob() on a canvas w/o rendering context doesn't throw");

promise_test(async function() {
    var canvas = new OffscreenCanvas(123, 456);
    var blob = await canvas.convertToBlob();
    assert_equals(blob.type, "image/png");
}, "convertToBlob() on an offscreen canvas w/o rendering context doesn't throw");
