"use strict";

(function(){
    let previous = Promise.resolve();
    /**
     * Schedule an asynchronous operation (described by a Promise-returning
     * function) to be executed following completion of every asynchronous
     * operation that has previously been scheduled in this way.
     *
     * @param {Function} async_op - Promise-returning function
     * @returns {Promise} resolved with the result of invoking the provided
     *                    function
     */
    function enqueue(async_op) {
        const next = previous.then(async_op);
        previous = next.catch(function() {});
        return next;
    }
    /**
     * Send a message to the opening browsing context.
     *
     * @param {any} value to be serialize and transmitted
     * @returns {Promise} settled when the opening browsing context has replied
     */
    function send(requestData) {
        window.opener.postMessage(requestData, "*");

        return new Promise(function(resolve, reject) {
            window.addEventListener("message", function handle(event) {
                const data = event.data;

                if (typeof data !== "object" || data === null) {
                    return;
                }

                if (data.type !== "testdriver-complete") {
                    return;
                }

                window.removeEventListener("message", handle);

                if (data.status === "success") {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    const get_selector = function(element) {
        let selector;

        if (element.id && document.getElementById(element.id) === element) {
            const id = element.id;

            selector = "#";
            // escape everything, because it's easy to implement
            for (let i = 0, len = id.length; i < len; i++) {
                selector += '\\' + id.charCodeAt(i).toString(16) + ' ';
            }
        } else {
            // push and then reverse to avoid O(n) unshift in the loop
            let segments = [];
            for (let node = element;
                 node.parentElement;
                 node = node.parentElement) {
                let segment = "*|" + node.localName;
                let nth = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
                segments.push(segment + ":nth-child(" + nth + ")");
            }
            segments.push(":root");
            segments.reverse();

            selector = segments.join(" > ");
        }

        return selector;
    };

    window.test_driver_internal.click = function(element) {
        return enqueue(function() {
                const selector = get_selector(element);
                return send({"type": "action", "action": "click", "selector": selector});
            });
    };

    window.test_driver_internal.send_keys = function(element, keys) {
         return enqueue(function() {
                const selector = get_selector(element);
                return send({"type": "action", "action": "send_keys", "selector": selector, "keys": keys});
            });
    };
})();
