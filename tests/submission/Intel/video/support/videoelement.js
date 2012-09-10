
/* http://dev.w3.org/html5/spec/single-page.html#the-video-element

interface HTMLVideoElement : HTMLMediaElement {
           attribute unsigned long width;
           attribute unsigned long height;
  readonly attribute unsigned long videoWidth;
  readonly attribute unsigned long videoHeight;
           attribute DOMString poster;
};

*/


var media;
var name;

function getmedia()
{
    if (media == null) {
        media = document.getElementById("m");
        name = document.getElementsByName("assert")[0].content;
    }
}

function media_attribute_exists(attr)
{
    getmedia();
    test(function() {
        assert_true(attr in media, "media." + attr + " in media element");
    }, name);
}



var ULONG = {
    'DEFAULT'  : 0,
    'MIN'      : 0,
    'INTEGER'  : 480,
    'FLOAT'    : 480.5,
    'MAX'      : 2147483647,
    'UPPER'    : 2147483648,
    'NEGATIVE' : -480,
    'INVALID'  : 'INVALID'
};

/* attribute unsigned long width; */

function video_width_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.width, 'number', "media.width of type");
    }, name);
}

function video_width_initial()
{
    getmedia();
    test(function() {
        assert_false(media.width < ULONG.MIN, "media.width initial negative");
    }, name);
}

function width_reflects(value, expected)
{
    getmedia();
    test(function() {
        media.width = value;
        assert_equals(media.width, expected, "media.width new value");
    }, name);
}

/* attribute unsigned long height; */

function video_height_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.height, 'number', "media.height of type");
    }, name);
}

function video_height_initial()
{
    getmedia();
    test(function() {
        assert_false(media.height < ULONG.MIN, "media.height initial negative");
    }, name);
}

function height_reflects(value, expected)
{
    getmedia();
    test(function() {
        media.height = value;
        assert_equals(media.height, expected, "media.height new value");
    }, name);
}
