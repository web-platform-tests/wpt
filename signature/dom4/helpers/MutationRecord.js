"use strict";
function getMutationRecordAsync(test) {
    var text = document.createTextNode('old');
    new MutationObserver(test.step_func_done(function (mutations, observer) {
        level1TestInstance(mutations[0], test.properties.def);
    })).observe(text, {characterData: true});
    text.data = 'new';
}
