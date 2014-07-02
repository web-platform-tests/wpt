"use strict";
function getCSSStyleDeclaration() {
    var e = document.documentElement; 
    if (e['style'] === undefined)
        throw new InstantiationError('Element.style is not defined');
    return e.style;
}