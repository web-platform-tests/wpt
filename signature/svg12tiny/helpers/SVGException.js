"use strict";
function getSVGException() {
    try {
        document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGMatrixComponents(0,0,0,0,0,0).inverse();
    } catch (e) {
        return e;
    }
    throw new InstantiationError('Expected exception not thrown.');
}
