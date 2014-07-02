"use strict";
function getCSSGroupingRule() {
    var e = document.createElement('style'); 
    e.textContent = '@media all {}';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}