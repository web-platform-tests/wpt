"use strict";
function getFileReader() {
    return !!window['FileReader'] && new FileReader()
}