"use strict";
var errorVideoElement;
function getTestErrorVideoElement() {
    if (!errorVideoElement) {
        errorVideoElement = document.createElement('video');
        errorVideoElement.src = 'data:,';
        errorVideoElement.preload = 'auto';
    }
    return errorVideoElement;
}