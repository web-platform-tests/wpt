// WebVRHelpers.js
//
// This file provides helpers for WebVR tests.
"use strict";

(function() {
    window.WebVRHelpers = new function() {
        ////////////////////////////////////////
        // Public Function Declarations
        this.RequestPresentOnVRDisplay = requestPresentOnVRDisplay;

        ////////////////////////////////////////
        // Public Constants Declarations

        // The tolerance to allow when comparing floats using assert_approx_equals()
        this.FloatErrorTolerance = 0.000001;

        ////////////////////////////////////////
        // Private member variables and state

        ////////////////////////////////////////
        // Private implementation functions

        // Calls requestPresent() on vrDisplay using the provided array of layers.
        // requestPresent() rejects the promise if the call is not initiated by a user gesture
        // such as a mouse click or a keyboard press. requestPresentOnVRDisplay creates a button
        // that calls requestPresent() when clicked and uses VRSimulator to simulate a user click
        // on the button.
        //
        // This function returns a promise that resolves or rejects when the vrDisplay.requestPresent()
        // promise resolves or rejects.
        //
        // vrDisplay - VRDisplay to call requestPresent() on
        // layer - Array of VRLayers to pass into vrDisplay.requestPresent()
        // fcnCall - Function object for an additional operation after requestPresent
        function requestPresentOnVRDisplay(vrDisplay, layers, fcnCall) {
            var requestPresentCompletedPromise = new Promise((resolve, reject) => {
                const REQUEST_PRESENT_BTN_ID = "requestPresentButton";

                var button = document.getElementById(REQUEST_PRESENT_BTN_ID);
                if (button === null) {
                    // If this function hasn't been called yet, create a button that will call requestPresent() when clicked.
                    button = document.createElement("button");
                    button.id = REQUEST_PRESENT_BTN_ID;
                    document.body.appendChild(button);
                }

                button.onclick = function() {
                    vrDisplay.requestPresent(layers).then(() => resolve(), () => reject());
                    if (fcnCall) {
                        fcnCall();
                    }
                };

                VRSimulator.UserConsentRequestPresent(REQUEST_PRESENT_BTN_ID);
            });

            return requestPresentCompletedPromise;
        }
    }
})();
