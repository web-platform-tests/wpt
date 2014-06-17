// Copyright (c) 2013 The WebRTC project authors. All Rights Reserved.
//
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file in the root of the source
// tree. An additional intellectual property rights grant can be found
// in the file PATENTS.  All contributing project authors may
// be found in the AUTHORS file in the root of the source tree.

setup({timeout:5000});

// Helper functions to minimize code duplication.
function failedCallback(test) {
  return test.step_func(function (error) {
    assert_unreached('Should not get an error callback');
  });
}
function invokeGetUserMedia(test, okCallback) {
  navigator.getUserMedia({ video: true, audio: true }, okCallback,
      failedCallback(test));
}

function createInvisibleVideoTag() {
  var video = document.createElement('video');
  video.autoplay = true;
  video.style.display = 'none';
  document.body.appendChild(video);
  return video;
}

// 4.2 MediaStream.
var mediaStreamTest = async_test('4.2 MediaStream');

function verifyMediaStream(stream) {
  // TODO(kjellander): Add checks for default values where applicable.
  test(function () {
    assert_own_property(stream, 'id');
    assert_true(typeof stream.id === 'string');
    assert_readonly(stream, 'id');
  }, '[MediaStream] id attribute');

  test(function () {
    assert_inherits(stream, 'getAudioTracks');
    assert_true(typeof stream.getAudioTracks === 'function');
  }, '[MediaStream] getAudioTracks function');

  test(function () {
    assert_inherits(stream, 'getVideoTracks');
    assert_true(typeof stream.getVideoTracks === 'function');
  }, '[MediaStream] getVideoTracks function');

  test(function () {
    assert_inherits(stream, 'getTrackById');
    assert_true(typeof stream.getTrackById === 'function');
  }, '[MediaStream] getTrackById function');

  test(function () {
    assert_inherits(stream, 'addTrack');
    assert_true(typeof stream.addTrack === 'function');
  }, '[MediaStream] addTrack function');

  test(function () {
    assert_inherits(stream, 'removeTrack');
    assert_true(typeof stream.removeTrack === 'function');
  }, '[MediaStream] removeTrack function');

  test(function () {
    assert_inherits(stream, 'clone');
    assert_true(typeof stream.clone === 'function');
  }, '[MediaStream] clone function');

  test(function () {
    assert_own_property(stream, 'active');
    assert_true(typeof stream.active === 'boolean');
    assert_readonly(stream, 'active');
  }, '[MediaStream] active attribute');

  test(function () {
    assert_own_property(stream, 'onactive');
    assert_true(stream.onactive === null);
  }, '[MediaStream] onactive EventHandler');

  test(function () {
    assert_own_property(stream, 'oninactive');
    assert_true(stream.oninactive === null);
  }, '[MediaStream] oninactive EventHandler');

  test(function () {
    assert_own_property(stream, 'onaddtrack');
    assert_true(stream.onaddtrack === null);
  }, '[MediaStream] onaddtrack EventHandler');

  test(function () {
    assert_own_property(stream, 'onremovetrack');
    assert_true(stream.onremovetrack === null);
  }, '[MediaStream] onremovetrack EventHandler');
}

mediaStreamTest.step(function() {
  var okCallback = mediaStreamTest.step_func(function (stream) {
    verifyMediaStream(stream);
    var videoTracks = stream.getVideoTracks();
    assert_true(videoTracks.length > 0);
    mediaStreamTest.done();
  });

  invokeGetUserMedia(mediaStreamTest, okCallback);
});

var mediaStreamCallbacksTest = async_test('4.2.2 MediaStream callbacks');

mediaStreamCallbacksTest.step(function() {
  var addCallbackCalled = false;
  var onAddTrackCallback = mediaStreamCallbacksTest.step_func(function (event) {
    assert_true(event.track instanceof MediaStreamTrack);
    addCallbackCalled = true;
  });
  var onRemoveTrackCallback =
      mediaStreamCallbacksTest.step_func(function (event) {
    assert_true(event.track instanceof MediaStreamTrack);
    assert_true(addCallbackCalled, 'Add should have been called after remove.');
    mediaStreamCallbacksTest.done();
  });
  var okCallback = mediaStreamCallbacksTest.step_func(function (stream) {
    var videoTracks = stream.getVideoTracks();

    // Verify event handlers are working.
    stream.onaddtrack = onAddTrackCallback;
    stream.onremovetrack = onRemoveTrackCallback;
    stream.removeTrack(videoTracks[0]);
    stream.addTrack(videoTracks[0]);
  });

  invokeGetUserMedia(mediaStreamCallbacksTest, okCallback);
});

// TODO(phoglund): add test for onactive/oninactive.

// 4.3 MediaStreamTrack.
var mediaStreamTrackTest = async_test('4.3 MediaStreamTrack');

function verifyTrack(type, track) {
  test(function () {
    assert_own_property(track, 'kind');
    assert_readonly(track, 'kind');
    assert_true(typeof track.kind === 'string',
        'kind is an object (DOMString)');
  }, '[MediaStreamTrack (' + type + ')] kind attribute');

  test(function () {
    assert_own_property(track, 'id');
    assert_readonly(track, 'id');
    assert_true(typeof track.id === 'string',
        'id is an object (DOMString)');
  }, '[MediaStreamTrack (' + type + ')] id attribute');

  test(function () {
    assert_own_property(track, 'label');
    assert_readonly(track, 'label');
    assert_true(typeof track.label === 'string',
        'label is an object (DOMString)');
  }, '[MediaStreamTrack (' + type + ')] label attribute');

  test(function () {
    assert_own_property(track, 'enabled');
    assert_true(typeof track.enabled === 'boolean');
    assert_true(track.enabled, 'enabled property must be true initially');
  }, '[MediaStreamTrack (' + type + ')] enabled attribute');

  test(function () {
    assert_own_property(track, 'muted');
    assert_readonly(track, 'muted');
    assert_true(typeof track.muted === 'boolean');
    assert_false(track.muted, 'muted property must be false initially');
  }, '[MediaStreamTrack (' + type + ')] muted attribute');

  test(function () {
    assert_own_property(track, 'onmute');
    assert_true(track.onmute === null);
  }, '[MediaStreamTrack (' + type + ')] onmute EventHandler');

  test(function () {
    assert_own_property(track, 'onunmute');
    assert_true(track.onunmute === null);
  }, '[MediaStreamTrack (' + type + ')] onunmute EventHandler');

  test(function () {
    assert_own_property(track, '_readonly');
    assert_readonly(track, '_readonly');
    assert_true(typeof track._readonly === 'boolean');
  }, '[MediaStreamTrack (' + type + ')] _readonly attribute');

  test(function () {
    assert_own_property(track, 'remote');
    assert_readonly(track, 'remote');
    assert_true(typeof track.remote === 'boolean');
  }, '[MediaStreamTrack (' + type + ')] remote attribute');

  test(function () {
    assert_own_property(track, 'readyState');
    assert_readonly(track, 'readyState');
    assert_true(typeof track.readyState === 'string');
    // TODO(kjellander): verify the initial state.
  }, '[MediaStreamTrack (' + type + ')] readyState attribute');

  test(function () {
    assert_own_property(track, 'onstarted');
    assert_true(track.onstarted === null);
  }, '[MediaStreamTrack (' + type + ')] onstarted EventHandler');

  test(function () {
    assert_own_property(track, 'onended');
    assert_true(track.onended === null);
  }, '[MediaStreamTrack (' + type + ')] onended EventHandler');

  test(function () {
    assert_inherits(track, 'getNativeSettings');
    assert_true(typeof track.capabilities === 'function');
  }, '[MediaStreamTrack (' + type + ')]: getNativeSettings function');

  test(function () {
    assert_inherits(track, 'clone');
    assert_true(typeof track.clone === 'function');
  }, '[MediaStreamTrack (' + type + ')] clone function');

  test(function () {
    assert_inherits(track, 'stop');
    assert_true(typeof track.stop === 'function');
  }, '[MediaStreamTrack (' + type + ')] stop function');

  test(function () {
    assert_inherits(track, 'getCapabilities');
    assert_true(typeof track.capabilities === 'function');
  }, '[MediaStreamTrack (' + type + ')]: getCapabilities function');

  test(function () {
    assert_inherits(track, 'getConstraints');
    assert_true(typeof track.constraints === 'function');
  }, '[MediaStreamTrack (' + type + ')]: getConstraints function');

  test(function () {
    assert_inherits(track, 'getSettings');
    assert_true(typeof track.constraints === 'function');
  }, '[MediaStreamTrack (' + type + ')]: getSettings function');

  test(function () {
    assert_inherits(track, 'applyConstraints');
    assert_true(typeof track.applyConstraints === 'function');
  }, '[MediaStreamTrack (' + type + ')]: applyConstraints function');
};

mediaStreamTrackTest.step(function() {
  var okCallback = mediaStreamTrackTest.step_func(function (stream) {
    verifyTrack('audio', stream.getAudioTracks()[0]);
    verifyTrack('video', stream.getVideoTracks()[0]);
    mediaStreamTrackTest.done();
  });
  invokeGetUserMedia(mediaStreamTrackTest, okCallback);
});

mediaStreamTrackTest.step(function() {
  var okCallback = mediaStreamTrackTest.step_func(function (stream) {
    // Verify event handlers are working.
    var track = stream.getVideoTracks()[0];
    track.onended = onEndedCallback
    track.stop();
    mediaStreamTrackTest.done();
  });
  var onEndedCallback = mediaStreamTrackTest.step_func(function () {
    assert_true(track.ended);
    mediaStreamTrackTest.done();
  });
  invokeGetUserMedia(mediaStreamTrackTest, okCallback);
});

// 4.4 MediaStreamTrackEvent tests.
var mediaStreamTrackEventTest = async_test('4.4 MediaStreamTrackEvent');
mediaStreamTrackEventTest.step(function() {
  var okCallback = mediaStreamTrackEventTest.step_func(function (stream) {
    // TODO(kjellander): verify attributes.
    mediaStreamTrackEventTest.done();
  });
  invokeGetUserMedia(mediaStreamTrackEventTest, okCallback);
});

// 6. Media streams as media elements.

var playingInMediaElementTest = async_test(
    '6.2 Loading and Playing a MediaStream in a Media Element');
playingInMediaElementTest.step(function() {
  var video = createInvisibleVideoTag();

  var okCallback = playingInMediaElementTest.step_func(function (stream) {
    video.onplay = playingInMediaElementTest.step_func(function() {
      // This depends on what webcam we're actually running with, but the
      // resolution should at least be greater than or equal to QVGA.
      assert_greater_than_equal(video.videoWidth, 320);
      assert_greater_than_equal(video.videoHeight, 240);

      playingInMediaElementTest.done();
    });
    video.srcObject = stream;
  });
  invokeGetUserMedia(playingInMediaElementTest, okCallback);
});

// Verifies a media element track (for instance belonging to a video tag)
// after it has been assigned a media stream.
function verifyOneMediaElementTrack(track, correspondingMediaStreamTrack) {
  assert_equals(track.id, correspondingMediaStreamTrack.id);
  assert_equals(track.kind, 'main');
  assert_equals(track.label, correspondingMediaStreamTrack.label);
  assert_equals(track.language, '');
}

var setsUpMediaTracksRightTest = async_test(
    '6.2 Sets up <video> audio and video tracks right');
setsUpMediaTracksRightTest.step(function() {
  var video = createInvisibleVideoTag();

  var okCallback = setsUpMediaTracksRightTest.step_func(function (stream) {
    video.onplay = setsUpMediaTracksRightTest.step_func(function() {
      // Verify the requirements on the video tag's streams as outlined in 6.2.
      // There could be any number of tracks depending on what device we have
      // connected, so verify all of them. There should be at least one of audio
      // and video each though.
      assert_inherits(video, 'videoTracks',
                      'Browser missing videoTracks support on media elements.');
      assert_readonly(video, 'videoTracks');
      assert_greater_than_equal(video.videoTracks.length, 1);
      assert_equals(video.videoTracks.length, stream.getVideoTracks().length);

      for (var i = 0; i < video.videoTracks.length; i++) {
        verifyOneMediaElementTrack(video.videoTracks[i],
                                   stream.getVideoTracks()[i]);
      }

      assert_inherits(video, 'audioTracks',
                      'Browser missing audioTracks support on media elements.');
      assert_readonly(video, 'audioTracks');
      assert_greater_than_equal(video.audioTracks.length, 1);
      assert_equals(video.audioTracks.length, stream.getAudioTracks().length);

      for (var i = 0; i < video.audioTracks.length; i++) {
        verifyOneMediaElementTrack(audio.audioTracks[i],
                                   stream.getAudioTracks()[i]);
      }

      setsUpMediaTracksRightTest.done();
    });
    video.srcObject = stream;
  });
  invokeGetUserMedia(setsUpMediaTracksRightTest, okCallback);
});

var mediaElementsTest =
  async_test('6.3 Media Element Attributes when Playing a MediaStream');

function verifyVideoTagWithStream(videoTag) {
  test(function () {
    assert_equals(videoTag.currentSrc, '');
  }, '[Video tag] currentSrc attribute');

  test(function () {
    assert_equals(videoTag.preload, 'none');
  }, '[Video tag] preload attribute');

  test(function () {
    assert_equals(videoTag.buffered.length, 0);
  }, '[Video tag] buffered attribute');

  test(function () {
    // Where 1 is NETWORK_IDLE.
    assert_equals(videoTag.networkState, 1);
  }, '[Video tag] networkState attribute');

  test(function () {
    // 0 is HAVE_NOTHING, 4 is HAVE_ENOUGH_DATA.
    assert_true(videoTag.readyState == 0 || videoTag.readyState == 4);
  }, '[Video tag] readyState attribute');

  test(function () {
    assert_true(videoTag.currentTime >= 0);
    assert_throws(
        'InvalidStateError', function () { videoTag.currentTime = 1234; },
        'Attempts to modify currentTime shall throw InvalidStateError');
  }, '[Video tag] currentTime attribute');

  test(function () {
    assert_equals(videoTag.duration, Infinity, 'videoTag.duration');
  }, '[Video tag] duration attribute');

  test(function () {
    assert_false(videoTag.seeking, 'videoTag.seeking');
  }, '[Video tag] seeking attribute');

  test(function () {
    assert_equals(videoTag.defaultPlaybackRate, 1.0);
    assert_throws(
        'DOMException', function () { videoTag.defaultPlaybackRate = 2.0; },
        'Attempts to alter videoTag.defaultPlaybackRate MUST fail');
  }, '[Video tag] defaultPlaybackRate attribute');

  test(function () {
    assert_equals(videoTag.playbackRate, 1.0);
    assert_throws(
        'DOMException', function () { videoTag.playbackRate = 2.0; },
        'Attempts to alter videoTag.playbackRate MUST fail');
  }, '[Video tag] playbackRate attribute');

  test(function () {
    assert_equals(videoTag.played.length, 1, 'videoTag.played.length');
    assert_equals(videoTag.played.start(0), 0);
    assert_true(videoTag.played.end(0) >= videoTag.currentTime);
  }, '[Video tag] played attribute');

  test(function () {
    assert_equals(videoTag.seekable.length, 0);
    // This is wrong in the standard: start() and end() must have arguments, but
    // since the time range is empty as we assert in the line above, there is no
    // valid argument with which we can call the methods.
    // assert_equals(videoTag.seekable.start(), videoTag.currentTime);
    // assert_equals(videoTag.seekable.end(), videoTag.currentTime);
  }, '[Video tag] seekable attribute');

  test(function () {
    assert_equals(videoTag.startDate, NaN, 'videoTag.startDate');
  }, '[Video tag] startDate attribute');

  test(function () {
    assert_false(videoTag.loop);
  }, '[Video tag] loop attribute');

};

mediaElementsTest.step(function() {
  var okCallback = mediaElementsTest.step_func(function (stream) {
    var video = createInvisibleVideoTag();
    video.srcObject = stream;
    verifyVideoTagWithStream(video);
    mediaElementsTest.done();
  });
  invokeGetUserMedia(mediaElementsTest, okCallback);
});

// 9. Enumerating local media devices.
// TODO(phoglund): add tests.

// 10. Obtaining local multimedia content.

function testGetUserMedia(test, constraints) {
  var okCallback = test.step_func(function (stream) {
    assert_true(stream !== null);
    test.done();
  });
  navigator.getUserMedia(constraints, okCallback, failedCallback(test));
}

var getUserMediaTestAudioVideo = async_test('10.1.1 NavigatorUserMedia A/V');
getUserMediaTestAudioVideo.step(function() {
  testGetUserMedia(getUserMediaTestAudioVideo, { video: true, audio: true });
});

var getUserMediaTestVideo = async_test('10.1.1 NavigatorUserMedia V');
getUserMediaTestVideo.step(function() {
  testGetUserMedia(getUserMediaTestVideo, { video: true, audio: false });
});

var getUserMediaTestAudio = async_test('10.1.1 NavigatorUserMedia A');
getUserMediaTestAudio.step(function() {
  testGetUserMedia(getUserMediaTestAudio, { video: false, audio: true });
});

var getUserMediaTestNull = async_test('10.1.1 NavigatorUserMedia Null');
getUserMediaTestNull.step(function() {
  testGetUserMedia(getUserMediaTestNull, null);
});

var getUserMediaTestPeerIdentity =
    async_test('10.2 NavigatorUserMedia with peerIdentity');
getUserMediaTestPeerIdentity.step(function() {
  var peerIdentity = 'my_identity';
  var okCallback = getUserMediaTestPeerIdentity.step_func(function (stream) {
    assert_true(stream !== null);
    stream.getVideoTracks().forEach(function(track) {
      assert_equals(track.peerIdentity, peerIdentity);
    });
    stream.getAudioTracks().forEach(function(track) {
      assert_equals(track.peerIdentity, peerIdentity);
    });
    getUserMediaTestPeerIdentity.done();
  });
  navigator.getUserMedia(
      {video: true, audio: true, peerIdentity: 'my_identity' },
      okCallback, failedCallback(getUserMediaTestPeerIdentity));
});

// 10.2 MediaStreamConstraints.
var constraintsTest = async_test('10.2 MediaStreamConstraints');
constraintsTest.step(function() {
  var okCallback = constraintsTest.step_func(function (stream) {
    assert_true(stream !== null);
    constraintsTest.done();
  });

  // See https://googlechrome.github.io/webrtc/samples/web/content/constraints/
  // for more examples of constraints.
  // TODO(phoglund): test more constraints; the possibilities here are endless.
  var constraints = {};
  constraints.audio = true;
  constraints.video = { mandatory: {}, optional: [] };
  constraints.video.mandatory.minWidth = 640;
  constraints.video.mandatory.minHeight = 480;
  constraints.video.mandatory.minFrameRate = 15;

  navigator.getUserMedia(constraints, okCallback,
                         failedCallback(constraintsTest));
});

// 10.4 NavigatorUserMediaSuccessCallback.
var successCallbackTest =
  async_test('10.4 NavigatorUserMediaSuccessCallback');
successCallbackTest.step(function() {
  var okCallback = successCallbackTest.step_func(function (stream) {
    assert_true(stream !== null);
    successCallbackTest.done();
  });
  invokeGetUserMedia(successCallbackTest, okCallback);
});

// 11. Constrainable Pattern.
// TODO(phoglund): add tests.
