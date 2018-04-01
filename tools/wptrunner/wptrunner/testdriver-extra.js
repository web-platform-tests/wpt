"use strict";

(function(){
    let pending_resolve = null;
    let pending_reject = null;
    window.addEventListener("message", function(event) {
        const data = event.data;

        if (typeof data !== "object" && data !== null) {
            return;
        }

        if (data.type !== "testdriver-complete") {
            return;
        }

        if (data.status === "success") {
            pending_resolve();
        } else {
            pending_reject();
        }
    });

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
        const selector = get_selector(element);
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.opener.postMessage({"type": "action", "action": "click", "selector": selector}, "*");
        return pending_promise;
    };

    window.test_driver_internal.actions = function(chain) {
        message = {};
        message.type = "action";
        message.action = "chain";
        message.actions_list = [];
        message.args_list = [];

        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });

        for (var i = 0; i < actions.length; i++) {
          message.actions_list.push(actions[i].type);
          inner_args_list = [];
          if (actions[i].args) {
            for (var j = 0; j < actions[i].args.length; j++) {
              if (actions[i].args[j].type == "element") {
                inner_args_list.push(get_selector(actions[i].args[j].arg));
              } else {
                inner_args_list.push(actions[i].args[j].arg);
              }
            }
          }
          message.args_list.push(inner_args_list.slice());
        }

        window.opener.postMessage(message, "*");
        return pending_promise;
    };
})();
