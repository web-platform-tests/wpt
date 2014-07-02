"use strict";
function getVideoTrack() {
    var e = document.createElement('video');
    if (!('videoTracks' in e))
        throw new InstantiationError('HTMLMediaElement.videoTracks is not defined.');
    var l = e.videoTracks; 
    if (l.length < 1)
        throw new InstantiationError('HTMLMediaElement.videoTracks length 0, no VideoTrack available to verify signature.');
    return l[0];
}