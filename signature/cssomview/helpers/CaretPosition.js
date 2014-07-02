"use strict";
function getCaretPosition() {
    if (document['caretPositionFromPoint'] === undefined)
        throw new InstantiationError('Document.caretPositionFromPoint is not defined');
    return document.caretPositionFromPoint(0,0);
}
