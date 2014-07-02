"use strict";
function getAudioTrackList() {
    var e = document.createElement('video');
    if (!('audioTracks' in e))
        throw new InstantiationError('HTMLMediaElement.audioTracks is not defined.');
    return e.audioTracks;
}