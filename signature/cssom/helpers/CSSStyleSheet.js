"use strict";
function getCSSStyleSheet() {
    var e = document.createElement('style'); 
    document.head.appendChild(e);
    return e.sheet;
}