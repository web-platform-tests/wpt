"use strict";
function getMediaQueryList() {
    if (window['matchMedia'] === undefined)
        throw new InstantiationError('Window.matchMedia is not defined');
    return window.matchMedia('screen');
}
