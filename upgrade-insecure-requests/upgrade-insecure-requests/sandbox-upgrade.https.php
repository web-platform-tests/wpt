<?php
    header("Content-Security-Policy: sandbox allow-scripts; upgrade-insecure-requests");
?>
<!DOCTYPE html>
<title>Upgrade Insecure Requests: Basics.</title>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script>
// This is a bit of a hack. UPGRADE doesn't upgrade the port number, so we
// specify this non-existent URL ('http' over port 8443). If UPGRADE doesn't
// work, it won't load.
var insecureImage = "http://127.0.0.1:8443/security/resources/abe.png";

(function() {
    var t = async_test("Verify that images are upgraded.");
    t.step(function () {
        var i = document.createElement('img');
        i.onload = t.step_func(function () {
            assert_equals(i.naturalHeight, 103, "Height.");
            assert_equals(i.naturalWidth, 76, "Width.");
            t.done();
        });
        i.onerror = t.step_func(function () {
            assert_unreached("The image should load successfully.");
        });

        i.src = insecureImage;
    });
}());

(function() {
    var t = async_test("Verify that images have correct cross-origin behavior.");
    t.step(function () {
        var i = document.createElement('img');
        i.onload = t.step_func(function () {
            // Draw the image onto a canvas.
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            ctx.drawImage(i, 0, 0);

            // Grab a pixel to verify that the image is cross-origin (because sandbox):
            try {
                var pixel = ctx.getImageData(0, 0, 1, 1);
                assert_unreached("The image should be cross-origin with this document.");
            } catch (e) {
                t.done();
            }
        });
        i.onerror = t.step_func(function () {
            assert_unreached("The image should load successfully.");
        });

        i.src = insecureImage;
    });
}());
</script>
