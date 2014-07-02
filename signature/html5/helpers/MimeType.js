"use strict";
function getMimeType() {
    if (!('navigator' in window))
        throw new InstantiationError('Window.navigator is not defined.');
    if (!('mimeTypes' in window.navigator))
        throw new InstantiationError('Window.navigator.mimeTypes is not defined.');
    if (window.navigator.mimeTypes.length < 1)
        throw new InstantiationError('Window.navigator.mimeTypes has length 0, no MIME type available to verify signature.');
    return window.navigator.mimeTypes[0];
}