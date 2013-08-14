
function supportsVibration () {
    if (undefined !== BrowserHasFeature(navigator, "vibrate")) {
        return true;
    }
    else {
        test(function () {
            assert_true(false, "Vibration API not found");
        }, "Your user agent does not support the Vibration API.");
        return false;
    }
}

