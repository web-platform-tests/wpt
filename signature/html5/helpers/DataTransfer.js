"use strict";
function getDataTransfer() {
    if (!('DragEvent' in window))
        throw new InstantiationError('DragEvent is not defined.');
    var e = new DragEvent('drop', {dataTransfer: { files: [] }});
    if (!('dataTransfer' in e))
        throw new InstantiationError('DragEvent.dataTransfer is not defined.');
    return e.dataTransfer;
}