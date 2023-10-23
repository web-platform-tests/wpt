// META: title=StorageManager: estimate()

test(function(t) {
    assert_true(navigator.storage.estimate() instanceof Promise);
}, 'estimate() method returns a Promise');

promise_test(function(t) {
    return navigator.storage.estimate().then(function(result) {
        assert_equals(typeof result, 'object');
        assert_true('usage' in result);
        assert_equals(typeof result.usage, 'number');
        assert_true('quota' in result);
        assert_equals(typeof result.quota, 'number');
    });
}, 'estimate() resolves to dictionary with members');
