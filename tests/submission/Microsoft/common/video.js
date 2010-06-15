/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/
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

