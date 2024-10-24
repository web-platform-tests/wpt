(function () {
    /**
     Represents `WebDriver BiDi <https://w3c.github.io/webdriver-bidi>`_ protocol.
     */
    window.test_driver.bidi = {
        /**
         * `log <https://w3c.github.io/webdriver-bidi/#module-log>`_ module.
         */
        log: {
            /**
             * `log.entryAdded <https://w3c.github.io/webdriver-bidi/#event-log-entryAdded>`_ event.
             */
            entry_added: {
                /**
                 * Subscribe to the `log.entryAdded` event. This does not
                 * add actual listeners. To listen to the event, use the
                 * `on` or `once` methods.
                 * @param {{contexts?: null | (string | Window)[]}} params - Parameters for the subscription.
                 * * `contexts`: an array of window proxies or browsing
                 * context ids to listen to the event. If not provided, the
                 * event subscription is done for the current window's
                 * browsing context. `null` for the global subscription.
                 * @return {Promise<void>}
                 */
                subscribe: async function (params = {}) {
                    return window.test_driver_internal.bidi.log.entry_added.subscribe(
                        params);
                },
                /**
                 * Add an event listener for the `log.entryAdded
                 * <https://w3c.github.io/webdriver-bidi/#event-log-entryAdded>`_ event. Make sure `subscribe` is
                 * called before using this method.
                 *
                 * @param callback {function(event): void} - The callback
                 * to be called when the event is fired.
                 * @returns {function(): void} - A function to call to
                 * remove the event listener.
                 */
                on: function (callback) {
                    return window.test_driver_internal.bidi.log.entry_added.on(
                        callback);
                },
                once: function () {
                    return new Promise(resolve => {
                        const remove_handler = window.test_driver_internal.bidi.log.entry_added.on(
                            data => {
                                resolve(data);
                                remove_handler();
                            });
                    });
                },
            }
        }
    };

    window.test_driver_internal.bidi = {
        log: {
            entry_added: {
                async subscribe() {
                    throw new Error(
                        "bidi.log.entry_added.subscribe is not implemented by testdriver-vendor.js");
                },
                on() {
                    throw new Error(
                        "bidi.log.entry_added.on is not implemented by testdriver-vendor.js");
                }
            }
        }
    };
})();
