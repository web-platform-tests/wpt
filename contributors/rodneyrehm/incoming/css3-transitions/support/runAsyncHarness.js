(function(root){
// testharness doesn't know about async test queues,
// so this wrapper takes care of that

/* USAGE:
    runAsyncHarness({
        // list of data to test, must be array of objects.
        // each object must contain a "name" property to describe the test
        // besides name, the object can contain whatever data you need
        tests: [
            {name: "name of test 1", custom: "data"},
            {name: "name of test 2", custom: "data"},
            // ...
        ],

        // general arguments:
        // data: the object from the tests-array that is currently being evaluated
        // options: the object you passed to runAsyncHarness()

        // all callbacks are optional:
        
        // invoked before a test starts so you can setup the environment
        // like DOM, CSS, adding event listeners and such
        setup: function(data, options){},

        // run as a async_test.step() this callback contains your primary assertions
        test: function(data, options){},

        // run as a async_test.step() this callback contains assertions to be run
        // when the test ended, immediately before teardown
        concluding: function(data, options){},

        // invoked after a test ended, so you can clean up the environment
        // like DOM, CSS, removing event listeners and such
        teardown: function(data, options){},

        // invoked once all tests are done
        done: function(options){}
    })
*/
root.runAsyncHarness = function(options) {
    var iteration = -1;
    var noop = function(){};
    
    // add a 100ms buffer to the test timeout, just in case
    var duration = Math.ceil(options.duration + 100);

    // initialize async tests
    // Note: satisfying testharness.js needs to know all async tests before load-event
    options.tests.forEach(function(data) {
        data.test = async_test(data.name);
    });

    function runLoop() {
        iteration++;

        var data = options.tests[iteration];
        if (!data) {
            // no more data, we're done
            (options.done || noop)(options);
            return;
        }

        // initialize test-run
        (options.setup || noop)(data, options);

        // perform test
        data.test.step(function() {
            (options.test || noop)(data, options);
        });

        // conclude test (possibly abort)
        setTimeout(function() {
            data.test.step(function() {
                (options.concluding || noop)(data, options);
            });
            // clean up after test-run
            (options.teardown || noop)(data, options);
            // tell harness we're done
            data.test.done(options);
            // next test please, give the browser 20ms to do catch its breath
            setTimeout(runLoop, 20);
        }, duration);
    }

    runLoop();
};

})(window);