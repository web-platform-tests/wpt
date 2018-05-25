(function() {
    "use strict";

    function getInViewCenterPoint(rect) {
        var left = Math.max(0, rect.left);
        var right = Math.min(window.innerWidth, rect.right);
        var top = Math.max(0, rect.top);
        var bottom = Math.min(window.innerHeight, rect.bottom);

        var x = 0.5 * (left + right);
        var y = 0.5 * (top + bottom);

        return [x, y];
    }

    function getPointerInteractablePaintTree(element) {
        if (!window.document.contains(element)) {
            return [];
        }

        var rectangles = element.getClientRects();

        if (rectangles.length === 0) {
            return [];
        }

        var centerPoint = getInViewCenterPoint(rectangles[0]);

        if ("elementsFromPoint" in document) {
            return document.elementsFromPoint(centerPoint[0], centerPoint[1]);
        } else if ("msElementsFromPoint" in document) {
            var rv = document.msElementsFromPoint(centerPoint[0], centerPoint[1]);
            return Array.prototype.slice.call(rv ? rv : []);
        } else {
            throw new Error("document.elementsFromPoint unsupported");
        }
    }

    function inView(element) {
        var pointerInteractablePaintTree = getPointerInteractablePaintTree(element);
        return pointerInteractablePaintTree.indexOf(element) !== -1;
    }


    /**
     * @namespace
     */
    window.test_driver = {
        /**
         * Triggers a user-initiated click
         *
         * This matches the behaviour of the {@link
         * https://w3c.github.io/webdriver/webdriver-spec.html#element-click|WebDriver
         * Element Click command}.
         *
         * @param {Element} element - element to be clicked
         * @returns {Promise} fulfilled after click occurs, or rejected in
         *                    the cases the WebDriver command errors
         */
        click: function(element) {
            if (window.top !== window) {
                return Promise.reject(new Error("can only click in top-level window"));
            }

            if (!window.document.contains(element)) {
                return Promise.reject(new Error("element in different document or shadow tree"));
            }

            if (!inView(element)) {
                element.scrollIntoView({behavior: "instant",
                                        block: "end",
                                        inline: "nearest"});
            }

            var pointerInteractablePaintTree = getPointerInteractablePaintTree(element);
            if (pointerInteractablePaintTree.length === 0 ||
                !element.contains(pointerInteractablePaintTree[0])) {
                return Promise.reject(new Error("element click intercepted error"));
            }

            var rect = element.getClientRects()[0];
            var centerPoint = getInViewCenterPoint(rect);
            return window.test_driver_internal.click(element,
                                                     {x: centerPoint[0],
                                                      y: centerPoint[1]});
        },

        /**
         * Send keys to an element
         *
         * This matches the behaviour of the {@link
         * https://w3c.github.io/webdriver/webdriver-spec.html#element-send-keys|WebDriver
         * Send Keys command}.
         *
         * @param {Element} element - element to send keys to
         * @param {String} keys - keys to send to the element
         * @returns {Promise} fulfilled after keys are sent, or rejected in
         *                    the cases the WebDriver command errors
         */
        send_keys: function(element, keys) {
            if (window.top !== window) {
                return Promise.reject(new Error("can only send keys in top-level window"));
            }

            if (!window.document.contains(element)) {
                return Promise.reject(new Error("element in different document or shadow tree"));
            }

            if (!inView(element)) {
                element.scrollIntoView({behavior: "instant",
                                        block: "end",
                                        inline: "nearest"});
            }

            var pointerInteractablePaintTree = getPointerInteractablePaintTree(element);
            if (pointerInteractablePaintTree.length === 0 ||
                !element.contains(pointerInteractablePaintTree[0])) {
                return Promise.reject(new Error("element send_keys intercepted error"));
            }

            return window.test_driver_internal.send_keys(element, keys);
        }
    };

    window.test_driver_internal = {
        /**
         * Waits for a user-initated click
         *
         * @param {Element} element - element to be clicked
         * @param {{x: number, y: number} coords - viewport coordinates to click at
         * @returns {Promise} fulfilled after click occurs
         */
        click: function(element, coords) {
            return new Promise(function(resolve) {
                element.addEventListener("click", resolve);
            });
        },

        /**
         * Waits for an element to receive a series of key presses
         *
         * @param {Element} element - element which should receve key presses
         * @param {String} keys - keys to expect
         * @returns {Promise} fulfilled after keys are received or rejected if
         *                    an incorrect key sequence is received
         */
        send_keys: function(element, keys) {
            return new Promise(function(resolve, reject) {
                var seen = "";

                function onKeyDown(event) {
                    if (event.key.length > 1) {
                        return;
                    }

                    seen += event.key;

                    if (keys.indexOf(seen) !== 0) {
                        reject(new Error("Unexpected key sequence: " + seen));
                    } else if (seen === keys) {
                        resolve();
                    }
                }

                element.addEventListener("keydown", onKeyDown);
            });
        }
    };
})();
