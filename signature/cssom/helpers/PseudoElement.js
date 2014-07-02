"use strict";
function getPseudoElement() {
    var e = document.documentElement;
    if (e['pseudo'] === undefined)
        throw new InstantiationError('Element.pseudo is not defined');
    return e.pseudo('::before');
}