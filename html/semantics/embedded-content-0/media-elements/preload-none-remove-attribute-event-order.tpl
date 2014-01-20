<!doctype html>
<title>HTMLMediaElement.preload:$start_state event order when preload is removed after $start_event is fired - $media_type</title>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script src="../resources/common.js"></script>
<p id="log">FAIL (script didn't run)</p>
<audio preload="$start_state" controls></audio>
<video preload="$start_state" controls></video>
<script>
var tests = init_tests("HTMLAudioElement.preload:$start_state event order when preload is removed after $start_event is fired - $media_type", "HTMLVideoElement.preload:$start_state event order when preload is removed after $start_event is fired - $media_type", {timeout:$timeout});
tests.forEach(function(vars) {
    var t = vars[0];
    t.step(function() {
	var tag_name = vars[1];
	var events_actual = '';
	var node = document.getElementsByTagName(tag_name)[0];
	var skip_once = true; // start_event = end_event = suspend, so endTest() should be called on the second occurence of the event
	var events  = ['loadstart', 'progress', 'suspend', 'abort', 'error', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
	for (var e in events) {
	    node.addEventListener(events[e], handleEvent, false);
	}
	node.addEventListener('$start_event', startTest, false);
	node.addEventListener('error', function() {
	    if (!node.canPlayType(tag_name + '/$media_type')) {
		t.step(function() {
		    assert_unreached("Cannot play '" + tag_name + "/$media_type'");
		    t.done();
		});
	    }
	}, false);
	node.src = $media_src;

	function startTest(e) {
	    node.removeEventListener('$start_event', startTest, false);
	    node.removeAttribute('preload');
	}

	function handleEvent(e) {
	    events_actual += e.type + ' ';
	    if (e.type == '$end_event') {
		if (!skip_once) endTest();
		else skip_once = false;
	    }
	}

	function endTest() {
	    t.step(function() {
		assert_regexp_match(events_actual, $events_expected, 'Event order check');
		assert_equals(node.preload, 'metadata', "'preload' value should be 'metadata'");
		t.done();
	    });
	}
    });
});
</script>
