// META: global=window,dedicatedworker

// FormData is not present in ShadowRealm

test(function() {
    var formData = new FormData()
    formData.append('a', 'b')
    formData.append('c', 'd')
    var params = new URLSearchParams(formData);
    assert_true(params != null, 'constructor returned non-null value.');
    assert_equals(params.get('a'), 'b');
    assert_equals(params.get('c'), 'd');
    assert_false(params.has('d'));
    // The name-value pairs are copied when created; later updates
    // should not be observable.
    formData.append('e', 'f');
    assert_false(params.has('e'));
    params.append('g', 'h');
    assert_false(formData.has('g'));
}, 'URLSearchParams constructor, FormData.');
