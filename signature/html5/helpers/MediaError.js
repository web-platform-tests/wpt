"use strict";
function getMediaError() {
    var e = document.createElement('video');
    if (!e)
        throw new InstantiationError('Document.createElement failed for video element type.');
    if (!('src' in e))
        throw new InstantiationError('HTMLVideoElement.src is not defined.');
    if (!('preload' in e))
        throw new InstantiationError('HTMLVideoElement.preload is not defined.');
    if (!('error' in e))
        throw new InstantiationError('HTMLVideoElement.error is not defined.');
    e.src = 'data:,';
    e.preload = 'auto';
    return e.error;
}