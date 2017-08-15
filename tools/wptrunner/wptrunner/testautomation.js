"use strict";

(function(){
    const global = Function('return this')();

    let pending_resolve = null;
    let pending_reject = null;
    window.addEventListener("message", function f(event) {
        const data = event.data;

        if (typeof data !== "object" && data !== null) {
            return;
        }

	if (data.type !== "testautomation-complete") {
            return;
        }

        if (data.status === "success") {
            pending_resolve();
        } else {
	    pending_reject();
        }
    });


    const random_string = function() {
        // slightly hackish, and will result in non-uniform distribution, but good enough
        let ran;
        do {
            ran = Math.random();
        } while(ran === 0.0);
        return ran.toString(16).substring(2);
    };

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
            let new_class;
            do {
                new_class = "testautomation-" + random_string();
            } while(document.getElementsByClassName(new_class).length > 0);
            element.classList.add(new_class);
            selector = "." + new_class;
        }

	return selector;
    };

    global.test_automation = {
        click: function(element) {
            const selector = get_selector(element);
            const pending_promise = new Promise(function(resolve, reject) {
		pending_resolve = resolve;
		pending_reject = reject;
	    });
            window.opener.postMessage({"type": "action", "action": "click", "selector": selector}, "*");
            return pending_promise;
        }
    };
})();
