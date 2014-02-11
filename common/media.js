//
// Returns the URI of a supported video source based on the user agent
//
function getVideoURI(base)
{
    var extension = '.mp4';

    var videotag = document.createElement("video");

    if ( videotag.canPlayType  &&
         videotag.canPlayType('video/ogg; codecs="theora, vorbis"') )
    {
        extension = '.ogv';
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

var result_timeout = 0;

//
// Clear the result timeout so that the test will not automatically pass/fail
//
function clearResultTimeout()
{
    if (result_timeout != 0)
    {
        window.clearTimeout(result_timeout);
        result_timeout = 0;
    }
}

//
// Passes the test
//
function passTest()
{
    document.getElementById("test_0_result").innerHTML = "PASS";
    clearResultTimeout();
}

//
// Fails the test
//
function failTest()
{
    document.getElementById("test_0_result").innerHTML = "FAIL";
    clearResultTimeout();
}

//
// Set the test to automatically fail after a timeout is reached
//
function setFailTimeout(milliseconds)
{
    clearResultTimeout();
    result_timeout = window.setTimeout("failTest();", milliseconds);
}
