(function() {
    "use strict";

    function getInViewCenterPoint(rect) {
        var left = Math.max(0, Math.min(rect.x, rect.x + rect.width));
        var right = Math.min(window.innerWidth, Math.max(rect.x, rect.x + rect.width));
        var top = Math.max(0, Math.min(rect.y, rect.y + rect.height));
        var bottom = Math.min(window.innerHeight, Math.max(rect.y, rect.y + rect.height));

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

        return document.elementsFromPoint(centerPoint[0], centerPoint[1]);
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
            var top = Math.min(rect.y, rect.y + rect.height);
            var left = Math.min(rect.x, rect.x + rect.width);
            var centerPoint = getInViewCenterPoint(rect);
            return window.test_driver_internal.click(element,
                                                     {x: top + centerPoint[0],
                                                      y: left + centerPoint[1]});
        }
    };

    window.test_driver_internal = {
        /**
         * Triggers a user-initated click
         *
         * @param {Element} element - element to be clicked
         * @param {{x: number, y: number} coords - viewport coordinates to click at
         * @returns {Promise} fulfilled after click occurs or rejected if click fails
         */
        click: function(element, coords) {
            return Promise.reject(new Error("unimplemented"));
        }
    };
})();
