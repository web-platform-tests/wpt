"use strict";
function getMediaList() {
    var e = document.createElement('style'); 
    e.textContent = '@media print, screen {}';
    document.head.appendChild(e);
    var s = e.sheet;
    if (s['media'] === undefined)
        throw new InstantiationError('StyleSheet.media is not defined');
    return s.media;
}