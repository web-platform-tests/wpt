"use strict";
function getBlob() {
    return !!window['Blob'] && new Blob();
}