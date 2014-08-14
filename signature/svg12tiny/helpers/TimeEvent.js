"use script";
function getTimeEventAsync(test) {
    var e = document.createElement('object');
    e.type = 'image/svg+xml';
    e.data = './resources/empty.svg';
    e.onload = test.step_func_done(function(evt) {
        var d = evt.target.contentDocument;
        assert_true(!!d, 'Content document is present.');
        level1TestInstance(d.createEvent('TimeEvent'), test.properties.def);
    });
    document.body.appendChild(e);
}
