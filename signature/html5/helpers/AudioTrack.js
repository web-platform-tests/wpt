"use strict";
function getAudioTrack() {
    var e = document.createElement('video');
    if (!('audioTracks' in e))
        throw new InstantiationError('HTMLMediaElement.audioTracks is not defined.');
    var l = e.audioTracks; 
    if (l.length < 1)
        throw new InstantiationError('HTMLMediaElement.audioTracks length 0, no AudioTrack available to verify signature.');
    return l[0];
}