"use strict";
function getTextTrackCue() {
    if ('DataCue' in window)
        return new DataCue();
    else if ('VTTCue' in window)
        return new VTTCue(0,0,'');
    else
        throw new InstantiationError('No derived class of TextTrackCue available');
}