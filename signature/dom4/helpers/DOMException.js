"use strict";
function getDOMException() {
    try {
        document.appendChild(document);
    } catch (e) {
        return e;
    }
    throw new InstantiationError('Expected exception not thrown.');
}
