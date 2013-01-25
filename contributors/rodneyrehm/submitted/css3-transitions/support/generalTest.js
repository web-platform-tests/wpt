(function(root) {

root.generalTest = {
    // prepare individual test
    setup: function(data, options) {
        domFixture();
        
        data.transition = {
            elem: document.getElementById('transition'),
            values: [],
            events: [],
            computedStyle: function(property) {
                return computedStyle(data.transition.elem, property);
            }
        };
        data.container = {
            elem: data.transition.elem.parentNode,
            values: [],
            events: [],
            computedStyle: function(property) {
                return computedStyle(data.container.elem, property);
            }
        };

        ['transition', 'container'].forEach(function(elem) {
            data[elem]._events = addTransitionEvent(data[elem].elem, function(event) {
                event.stopPropagation();
                var name = event.propertyName;
                var time = Math.round(event.elapsedTime * 1000) / 1000;
                var pseudo = event.pseudoElement ? (':' + event.pseudoElement) : '';
                data[elem].events.push(name + pseudo + ":" + time + "s");
            });
        });
        
        if (data.pseudo) {
            data.pseudo = {
                name: data.pseudo,
                values: [],
                computedStyle: function(property) {
                    return computedStyle(data.transition.elem, property, ':' + data.pseudo.name);
                }
            };
        }

        // placeholder for "meaningful" failure reason
        data.__reason = undefined;
    },
    // cleanup after individual test
    teardown: function(data, options) {
        generalTest.stopValueCollection(data, options);
        if (data.__reason) {
            root._failureReasons[data.name] = data.__reason;
        }
    },
    // called once all tests are done
    done: function(options) {
        domFixture();
        setStyle();
        reflow();
    },
    
    // set style and compute values for container and transition
    setStyle: function(data, style) {
        setStyle(style);
        
        reflow();
        data.container.from = data.container.computedStyle(data.property);
        data.transition.from = data.transition.computedStyle(data.property);
        if (data.pseudo) {
            data.pseudo.from = data.pseudo.computedStyle(data.property);
        }
        data.container.elem.classList.add('to');
        data.transition.elem.classList.add('to');
        reflow();
        data.container.to = data.container.computedStyle(data.property);
        data.transition.to = data.transition.computedStyle(data.property);
        if (data.pseudo) {
            data.pseudo.to = data.pseudo.computedStyle(data.property);
        }
        data.container.elem.classList.remove('to');
        data.transition.elem.classList.remove('to');
        reflow();
    },
    // add transition and to classes to container and transition
    startTransition: function(data) {
        data.container.elem.classList.add('transition');
        data.transition.elem.classList.add('transition');
        reflow();
        data.container.elem.classList.add('to');
        data.transition.elem.classList.add('to');
    },
    // requestAnimationFrame runLoop to collect computed values
    startValueCollection: function(data, callback) {
        var raf = getRequestAnimationFrame() || function(callback){
            setTimeout(callback, 20);
        };

        data._collectValues = true;

        function runLoop() {
            if (!data._collectValues) {
                return;
            }

            ['transition', 'container', 'pseudo'].forEach(function(elem) {
                var pseudo = null;
                if (elem === 'pseudo' && !data.pseudo) {
                    return;
                }
                
                var current = data[elem].computedStyle(data.property);
                var values = data[elem].values;
                var length = values.length;
                if (!length || values[length - 1] !== current) {
                    values.push(current);
                    if (callback) {
                        callback(elem, current, values);
                    }
                }
            });
            
            raf(runLoop);
        }
        
        runLoop();
    },
    // stop requestAnimationFrame runLoop collecting computed values
    stopValueCollection: function(data, options) {
        data._collectValues = false;
    },

    // generate test.step function asserting collected events match expected
    assertExpectedEventsFunc: function(data, elem, expected) {
        return function() {
            var _result = data[elem].events.sort().join(" ");
            var _expected = typeof expected === 'string' ? expected : expected.sort().join(" ");
            assert_equals(_result, _expected, "Expected TransitionEnd events triggered on #" + elem);
        };
    },
    // generate test.step function asserting collected values are neither initial nor target
    assertIntermediateValuesFunc: function(data, elem) {
        return function() {
            // the first value (index: 0) is always going to be the initial value
            // the last value is always going to be the target value
            var values = data[elem].values;
            if (data.flags.discrete) {
                // a discrete value will just switch from one state to another without having passed intermediate states.
                assert_equals(values[0], data[elem].from, "must be initial value while transitioning on #" + elem);
                assert_equals(values[1], data[elem].to, "must be target value after transitioning on #" + elem);
                assert_equals(values.length, 2, "discrete property only has 2 values #" + elem);
            } else {
                assert_not_equals(values[1], data[elem].from, "may not be initial value while transitioning on #" + elem);
                assert_not_equals(values[1], data[elem].to, "may not be target value while transitioning on #" + elem);
            }
        };
    }
};

})(window);