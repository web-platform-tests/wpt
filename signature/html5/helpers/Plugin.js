"use strict";
function getPlugin() {
    if (!('navigator' in window))
        throw new InstantiationError('Window.navigator is not defined.');
    if (!('plugins' in window.navigator))
        throw new InstantiationError('Window.navigator.plugins is not defined.');
    if (window.navigator.plugins.length < 1)
        throw new InstantiationError('Window.navigator.plugins has length 0, no plugin available to verify signature.');
    return window.navigator.plugins[0];
}