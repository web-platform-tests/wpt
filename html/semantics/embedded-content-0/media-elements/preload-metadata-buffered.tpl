<!doctype html>
<title>HTMLMediaElement.preload:metadata 'buffered' check - $media_type</title>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script src="../resources/common.js"></script>
<p id="log">FAIL (script didn't run)</p>
<audio preload="metadata" controls></audio>
<video preload="metadata" controls></video>
<script>
var tests = init_tests("HTMLAudioElement.preload:metadata 'buffered' check - $media_type", "HTMLVideoElement.preload:metadata 'buffered' check - $media_type", {timeout:$timeout});
tests.forEach(function(vars) {
    var t = vars[0];
    t.step(function() {
	var tag_name = vars[1];
	var events_actual = [];
	var node = document.getElementsByTagName(tag_name)[0];
	startTest();

	function startTest() {
	    var events  = ['loadstart', 'progress', 'suspend', 'abort', 'error', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
	    for (var e in events) {
		node.addEventListener(events[e], handleEvent, false);
	    }
	    node.src = $media_src;
	}

	function handleEvent(e) {
	    if (e.type == 'error' && !node.canPlayType(tag_name + '/$media_type')) {
		t.step(function() {
		    assert_unreached("Cannot play '" + tag_name + "/$media_type'");
		    t.done();
		});
	    }
	    if (e.type == 'suspend') endTest();
	}

	function endTest() {
	    t.step(function() {
		assert_equals(node.buffered.length, 1, "'buffered' should have a length of 1");
		assert_equals(node.buffered.start(0), 0, "The start of buffered timerange should be 0");
		assert_true(node.buffered.end(0) < $max_buffer, "The end of buffered timerange should be less than $max_buffer seconds" );
		t.done();
	    });
	}
    });
});
</script>