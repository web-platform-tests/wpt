/**
 * @namespace
 */
var test_automation = {
    /**
     * Triggers a user-initiated click
     *
     * This matches the behaviour of the {@link
     * https://www.w3.org/TR/webdriver/#element-click|WebDriver
     * Element Click command}.
     * 
     * @param {Element} element - element to be clicked
     * @returns {Promise} fulfilled after click occurs, or rejected in
     *                    the cases the WebDriver command errors
     */
    click: function(element) {
        throw new Error("not implemented");
    }
};
