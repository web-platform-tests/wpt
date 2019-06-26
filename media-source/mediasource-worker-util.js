var mediaSource;
var sourceBuffer;
var mediaData;
var mediaLoaded = false;

function loadData_(url, callback, isBinary)
{
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    if (isBinary) {
        request.responseType = 'arraybuffer';
    }
    request.onload = function(event)
    {
        if (request.status != 200) {
            postMessage("Unexpected loadData_ status code : " + request.status);
            return;
        }
        var response = request.response;
        if (isBinary) {
            response = new Uint8Array(response);
        }
        callback(response);
    };
    request.onerror = function(event)
    {
        postMessage("Unexpected loadData_ error");
    };
    request.send();
}

loadData_('webm/test.webm', function(response) {
    mediaData = response;
    mediaLoaded = true;
    postMessage("media loaded");
}, true);

function waitUntilLoadedThenAppend() {
    if (!mediaLoaded) {
        setTimeout(waitUntilLoadedThenAppend, 10); // This is not ideal, just a hacky busy-wait.
        return;
    }
    sourceBuffer.appendBuffer(mediaData);
}

onmessage = function(evt)
{
    if (evt.data == "createMediaSource") {
        mediaSource = new MediaSource();
        // BIG TODO rework if using MediaSourceHandle instead of objectURL for
        // MSE-in-workers.
        postMessage(evt.data + "_done:" + URL.createObjectURL(mediaSource));
        // BIG TODO rework once early open functionality is designed and
        // implemented.
        mediaSource.onsourceopen = function() {
            postMessage("onsourceopen");
            // BIG TODO make more generic like mediasource-utils.js
            sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8,vorbis"');
            sourceBuffer.onupdateend = function() {
                postMessage("onupdateend first time");
                sourceBuffer.onupdateend = function() {
                    postMessage("onupdateend second time");
                    mediaSource.endOfStream();
                    postMessage("endOfStream");
                };
                // (Note, autoplay policy must allow playback without user
                // gesture for play to actually proceed..)
                // Appending more after reaching HAVE_METADATA and playing a bit confirmed bug
                // in worker thread SourceBuffer::GetMediaTime() poking into WMPI not on main thread.
                // That is now fixed by pumping element error and currentTime
                // into MediaSource (using fine-grained lock).
                sourceBuffer.appendBuffer(mediaData);
            };
            waitUntilLoadedThenAppend();
        };
    }
}
