//setting the default_timeout in testharness.js
setup({timeout:20000});

function init_tests(a_title, v_title, properties) {
    document.getElementById('log').textContent = 'Running...';
    var fragment = document.location.hash.substring(1);
    var tests = []
    if (fragment == 'audio') {
	var t_a = async_test(a_title, properties);
	tests.push([t_a, 'audio']);
    } else if (fragment == 'video') {
	var t_v = async_test(v_title, properties);
	tests.push([t_v, 'video']);
    }
    else {
	var t_a = async_test(a_title, properties);
	var t_v = async_test(v_title, properties);
	tests.push([t_a, 'audio']);
	tests.push([t_v, 'video']);
    }
    return tests;
}