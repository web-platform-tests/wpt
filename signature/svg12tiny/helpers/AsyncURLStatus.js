"use script";
// See http://dev.w3.org/SVG/profiles/1.2T/test/svg/udom-glob-204-t.svg for comparison.
function getAsyncURLStatusAsync(test) {
    if (!('getURL' in window))
        throw new InstantiationError('Window.getURL is not defined.');
    window.getURL('./resources/empty.svg', test.step_func_done(function(status) {
        level1TestInstance(status, test.properties.def);
    }));
}
