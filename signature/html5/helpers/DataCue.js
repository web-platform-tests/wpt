"use strict";
function getDataCue() {
    if (!('DataCue' in window))
        throw new InstantiationError('DataCue is not defined.');
    return new DataCue();
}