"use strict";
// Usage Notes
// On chrome, chrome://flags/#enable-experimental-web-platform-features must be enabled.
function getFile() {
    return !!window['File'] && new File([], 'delete.me');
}