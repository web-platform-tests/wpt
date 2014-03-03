//
// Returns the URI of a supported video source based on the user agent
//
// Note: this function gives preference to webm over mp4 
//
function getVideoURI(base)
{
    // note that getFileExtension expects to find ';' and starts with 'video/' in each of the video_types
    var video_types = [
                        'video/webm;codecs="vp8,vorbis"',
                        'video/mp4; codecs="avc1.42E01E"',
                        'video/ogg; codecs="theora, vorbis"'
                         ];
    function getFileExtension(type) {
        // type is one from video_types
        return '.' + type.substring(6, type.indexOf(';'));
    }

    var extension = '.mp4'; // try mp4 is everything else fails
    var probably_extension = null;
    var maybe_extension = null;

    var videotag = document.createElement("video");

    if ( videotag.canPlayType )
    { 
        video_types.forEach(
            function (type) {
                // don't invoke canPlayType unless we're still looking
                if (probably_extension === null) {
                    var canPlay = videotag.canPlayType(type);
                    if (canPlay === "probably") {
                        probably_extension = getFileExtension(type);
                    }
                    if (maybe_extension === null  && canPlay === "maybe") {
                        maybe_extension = getFileExtension(type);
                    }
                }
            }
        );
    }
    if (probably_extension !== null) {
        extension = probably_extension;
    } else if (maybe_extension !== null) {
        extension = maybe_extension;
    }
    return base + extension;
}

//
// Returns the URI of a supported audio source based on the user agent
//
function getAudioURI(base)
{
    var extension = '.mp3';

    var audiotag = document.createElement("audio");

    if ( audiotag.canPlayType &&
         audiotag.canPlayType('audio/ogg') )
    {
        extension = '.oga';
    }

    return base + extension;
}
