"use strict";
function getFileList() {
    var e = document.createElement('input');
    e.type = 'file';
    return e.files;
}