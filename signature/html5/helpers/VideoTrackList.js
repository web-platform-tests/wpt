"use strict";
function getVideoTrackList() {
    var e = document.createElement('video');
    if (!('videoTracks' in e))
        throw new InstantiationError('HTMLMediaElement.videoTracks is not defined.');
    return e.videoTracks;
}