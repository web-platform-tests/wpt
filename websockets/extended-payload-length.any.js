// META: script=constants.js?pipe=sub

async_test(function(t){
    var ws = new WebSocket(SCHEME_DOMAIN_PORT+'/echo');
    var datasize = 125;
    var data = null;
    ws.onopen = t.step_func(function(e) {
        data = new Array(datasize + 1).join('a');
        ws.send(data);
    });
    ws.onmessage = t.step_func(function(e) {
        assert_equals(e.data, data);
        t.done();
    });
}, "Application data is 125 byte which means any 'Extended payload length' field isn't used at all.", {timeout:20000});

async_test(function(t){
    var ws = new WebSocket(SCHEME_DOMAIN_PORT+'/echo');
    var datasize = 126;
    var data = null;
    ws.onopen = t.step_func(function(e) {
        data = new Array(datasize + 1).join('a');
        ws.send(data);
    });
    ws.onmessage = t.step_func(function(e) {
        assert_equals(e.data, data);
        t.done();
    });
}, "Application data is 126 byte which starts to use the 16 bit 'Extended payload length' field.", {timeout:20000});

async_test(function(t){
    var ws = new WebSocket(SCHEME_DOMAIN_PORT+'/echo');
    var datasize = 0xFFFF;
    var data = null;
    ws.onopen = t.step_func(function(e) {
        data = new Array(datasize + 1).join('a');
        ws.send(data);
    });
    ws.onmessage = t.step_func(function(e) {
        assert_equals(e.data, data);
        t.done();
    });
}, "Application data is 0xFFFF byte which means the upper bound of the 16 bit 'Extended payload length' field.", {timeout:20000});

async_test(function(t){
    var ws = new WebSocket(SCHEME_DOMAIN_PORT+'/echo');
    var datasize = 0xFFFF + 1;
    var data = null;
    ws.onopen = t.step_func(function(e) {
        data = new Array(datasize + 1).join('a');
        ws.send(data);
    });
    ws.onmessage = t.step_func(function(e) {
        assert_equals(e.data, data);
        t.done();
    });
}, "Application data is (0xFFFF + 1) byte which starts to use the 64 bit 'Extended payload length' field", {timeout:20000});
