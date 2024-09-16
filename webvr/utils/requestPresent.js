// requestPresent.js
//
// This file provides helpers for testing VRDisplay requestPresent.

function setupVRDisplay(test) {
    assert_equals(typeof (navigator.getVRDisplays), "function", "'navigator.getVRDisplays()' must be defined.");
    return VRSimulator.AttachWebVRDisplay().then(() => {
        return navigator.getVRDisplays();
    }).then((displays) => {
        assert_equals(displays.length, 1, "displays.length must be one after attach.");
        this.vrDisplay = displays[0];
        return validateNewVRDisplay(test, this.vrDisplay);
    });
}

// Validate the settings off a freshly created VRDisplay (prior to calling
// requestPresent).
function validateNewVRDisplay(test, display) {
    assert_true(display.capabilities.canPresent, "display.capabilities.canPresent must always be true for HMDs.");
    assert_equals(display.capabilities.maxLayers, 1, "display.capabilities.maxLayers must always be 1 when display.capabilities.canPresent is true for 1.1 spec revision.");
    assert_false(display.isPresenting, "display.isPresenting must be false before calling requestPresent.");
    assert_equals(display.getLayers().length, 0, "display.getLayers() should have no layers if not presenting.");
    var promise = display.exitPresent();
    return promise_rejects(test, null, promise, "newly created VRDisplay was validated.");
}

// Validate the settings off a VRDisplay after requestPresent promise fulfilled.
function validateDisplayIsPresenting(display) {
    assert_true(display.isPresenting, "display.isPresenting must be true if requestPresent is fulfilled.");
    assert_equals(display.getLayers().length, 1, "display.getLayers() should have one layer if requestPresent is fulfilled.");
}

// Validate the settings off a VRDisplay after requestPresent promise is
// rejected or after exitPresent is fulfilled.
function validateDisplayNotPresenting(test, display) {
    assert_false(display.isPresenting, "display.isPresenting must be false if requestPresent is rejected or after exitPresent is fulfilled.");
    assert_equals(display.getLayers().length, 0, "display.getLayers() should have no layers if requestPresent is rejected  or after exitPresent is fulfilled.");
    var promise = display.exitPresent();
    return promise_rejects(test, null, promise, "VRDisplay is not presenting as expected.");
}
