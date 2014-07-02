"use strict";
function getDataTransferItemList() {
    if (!('DragEvent' in window))
        throw new InstantiationError('DragEvent is not defined.');
    var e = new DragEvent('drop', {dataTransfer: { files: [] }});
    if (!e)
        throw new InstantiationError('DragEvent instance not returned by constructor.');
    if (!('dataTransfer' in e))
        throw new InstantiationError('DragEvent.dataTransfer is not defined.');
    var d = e.dataTransfer;
    if (!d)
        throw new InstantiationError('DragEvent.dataTransfer is null.');
    if (!('items' in d))
        throw new InstantiationError('DataTransfer.items is not defined.');
    return d.items;
}