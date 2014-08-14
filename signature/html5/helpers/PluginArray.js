"use strict";
function getPluginArray() {
    if (!('navigator' in window))
        throw new InstantiationError('Window.navigator is not defined.');
    if (!('plugins' in window.navigator))
        throw new InstantiationError('Window.navigator.plugins is not defined.');
    return window.navigator.plugins;
}