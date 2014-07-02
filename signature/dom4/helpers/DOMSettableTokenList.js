"use strict";
function getDOMSettableTokenList() {
    var e = document.createElement('link');
    if (!('sizes' in e))
        throw new InstantiationError('HTMLLinkElement.sizes is not defined.');
    return e.sizes;
}
