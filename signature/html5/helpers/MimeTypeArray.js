"use strict";
function getMimeTypeArray() {
    if (!('navigator' in window))
        throw new InstantiationError('Window.navigator is not defined.');
    if (!('mimeTypes' in window.navigator))
        throw new InstantiationError('Window.navigator.mimeTypes is not defined.');
    return window.navigator.mimeTypes;
}