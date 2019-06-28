// Copyright © 2019 Chromium authors and World Wide Web Consortium, (Massachusetts Institute of Technology, ERCIM, Keio University, Beihang).

// This script implements the web worker portion of the
// mediasource-worker-play.html test.
// It immediately creates a MediaSource, registers its ObjectURL and posts that
// url (without awaiting a request for it from the main Window thread.)
// It then picks a supported media test type (if any) and begins asynchronously
// retrieving it.
// Upon handling the first "sourceopen" event on the MediaSource,
// the worker ensures the media fetch is completed and then buffers it into the
// MediaSource.

if (!this.MediaSource)
  postMessage("Error: MediaSource API missing from Worker");

let mediaSource = new MediaSource();
let mediaSourceObjectUrl = URL.createObjectURL(mediaSource);
postMessage(mediaSourceObjectUrl);

let sourceBuffer;
let foundSupportedMedia = false;
let mediaMetadata;
let mediaLoad;

// Find supported test media, if any.
let MEDIA_LIST = [
  {
    url: 'mp4/test.mp4',
    type: 'video/mp4; codecs="mp4a.40.2,avc1.4d400d"',
  },
  {
    url: 'webm/test.webm',
    type: 'video/webm; codecs="vp8, vorbis"',
  },
];
for (let i = 0; i < MEDIA_LIST.length; ++i) {
  mediaMetadata = MEDIA_LIST[i];
  if (this.MediaSource && MediaSource.isTypeSupported(mediaMetadata.type)) {
    foundSupportedMedia = true;
    break;
  }
}

function loadBinaryAsync(url) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = 'arraybuffer';
    request.onerror = (event) => { reject(event); };
    request.onload = () => {
      if (request.status != 200) {
        reject("Unexpected loadData_ status code : " + request.status);
      }
      let response = new Uint8Array(request.response);
      resolve(response);
    };
    request.send();
  });
}

if (foundSupportedMedia) {
  mediaLoad = loadBinaryAsync(mediaMetadata.url);
} else {
  postMessage("Error: No supported test media");
}

onmessage = function(evt) {
  postMessage("Error: No message expected by Worker");
};

mediaSource.addEventListener("sourceopen", () => {
  URL.revokeObjectURL(mediaSourceObjectUrl);
  sourceBuffer = mediaSource.addSourceBuffer(mediaMetadata.type);
  sourceBuffer.onerror = (err) => {
    postMessage("Error: " + err);
  };
  sourceBuffer.onupdateend = () => {
    // Shorten the buffered media and test playback duration to avoid timeouts.
    sourceBuffer.remove(0.5, Infinity);
    sourceBuffer.onupdateend = () => {
      sourceBuffer.duration = 0.5;
      mediaSource.endOfStream();
    };
  };
  mediaLoad.then( (mediaData) => { sourceBuffer.appendBuffer(mediaData); },
                  (err) => { postMessage("Error: " + err) } );
}, { once : true });
