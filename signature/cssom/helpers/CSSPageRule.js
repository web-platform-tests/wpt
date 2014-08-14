"use strict";
function getCSSPageRule() {
    var e = document.createElement('style'); 
    e.textContent = '@page { margin: 1cm; }';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}