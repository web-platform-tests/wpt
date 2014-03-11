//
// Returns the URI of a supported video source based on the user agent
//
function getVideoURI(base)
{
    var v = document.createElement("video");
    if (v.canPlayType("video/webm"))
        return base + '.webm';
    if (v.canPlayType("video/ogg"))
        return base + '.ogv';
    return base + '.m4v';
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
