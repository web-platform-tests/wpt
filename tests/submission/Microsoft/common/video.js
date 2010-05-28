//
// Just appends a .xyz so that the UA
// gets a video stream that is supported
//
function getVideoExtension(videoName)
{
    var extension = '.mp4';

    if ( navigator.userAgent.match(/firefox/i)  != null ||
         navigator.userAgent.match(/chrome/i) != null ||
         navigator.userAgent.match(/opera/i)  != null )
    {
        extension = '.ogv';
    }

    return videoName + extension;

}

