"use script";
function getWorkerGlobalScopeAsync(test) {
    var w = new Worker('./resources/workerglobalscope.js');
    w.onmessage = test.step_func_done(function(evt) {
    });
    w.postMessage(test.def);
}

