"use script";
function getDocumentAsync(test) {
    var e = document.createElement('object');
    e.type = 'image/svg+xml';
    e.data = './resources/empty.svg';
    e.onload = test.step_func_done(function(evt) {
        var d = evt.target.contentDocument;
        level1TestInstance(d, test.properties.def);
    });
    document.body.appendChild(e);
}
