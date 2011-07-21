<!doctype html>
<title>HTMLMediaElement.preload:$start_state $test_state_type when preload is set to $end_state before a source element is appended - $media_type</title>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script src="../resources/common.js"></script>
<p id="log">FAIL (script didn't run)</p>
<audio preload="$start_state" controls></audio>
<video preload="$start_state" controls></video>
<script>
var tests = init_tests("HTMLAudioElement.preload:$start_state $test_state_type when preload is set to $end_state before a source element is appended - $media_type", "HTMLVideoElement.preload:$start_state $test_state_type when preload is set to $end_state before a source element is appended - $media_type");
tests.forEach(function(vars) {
    var t = vars[0];
    t.step(function() {
	var tag_name = vars[1];
	var states_actual = '';
	var node = document.getElementsByTagName(tag_name)[0];
	node.addEventListener('$end_event', endTest, false);
	node.addEventListener('error', function() {
	    if (!node.canPlayType(tag_name + '/$media_type')) {
		t.step(function() {
		    assert_unreached("Cannot play '" + tag_name + "/$media_type'");
		    t.done();
		});
	    }
	}, false);
	var source  = document.createElement('source');
	source.src = $media_src;
	node.preload = '$end_state';
	node.appendChild(source);

	function endTest() {
	    t.step(function() {
		assert_equals(node.$test_state_type, $state_expected, '$test_state_type after suspend')
		t.done();
	    });
	}
    });
});
</script>