
/* http://dev.w3.org/html5/spec/single-page.html#media-elements

interface HTMLMediaElement : HTMLElement {

  // error state
  readonly attribute MediaError? error;

  // network state
           attribute DOMString src;
  readonly attribute DOMString currentSrc;
           attribute DOMString crossOrigin;
  const unsigned short NETWORK_EMPTY = 0;
  const unsigned short NETWORK_IDLE = 1;
  const unsigned short NETWORK_LOADING = 2;
  const unsigned short NETWORK_NO_SOURCE = 3;
  readonly attribute unsigned short networkState;
           attribute DOMString preload;
  readonly attribute TimeRanges buffered;
  void load();
  DOMString canPlayType(DOMString type);

  // ready state
  const unsigned short HAVE_NOTHING = 0;
  const unsigned short HAVE_METADATA = 1;
  const unsigned short HAVE_CURRENT_DATA = 2;
  const unsigned short HAVE_FUTURE_DATA = 3;
  const unsigned short HAVE_ENOUGH_DATA = 4;
  readonly attribute unsigned short readyState;
  readonly attribute boolean seeking;

  // playback state
           attribute double currentTime;
  readonly attribute unrestricted double duration;
  readonly attribute Date startDate;
  readonly attribute boolean paused;
           attribute double defaultPlaybackRate;
           attribute double playbackRate;
  readonly attribute TimeRanges played;
  readonly attribute TimeRanges seekable;
  readonly attribute boolean ended;
           attribute boolean autoplay;
           attribute boolean loop;
  void play();
  void pause();

  // media controller
           attribute DOMString mediaGroup;
           attribute MediaController? controller;

  // controls
           attribute boolean controls;
           attribute double volume;
           attribute boolean muted;
           attribute boolean defaultMuted;

  // tracks
  readonly attribute VideoTrackList audioTracks;
  readonly attribute VideoTrackList videoTracks;
  readonly attribute TextTrackList textTracks;
  TextTrack addTextTrack(DOMString kind, optional DOMString label, optional DOMString language);
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


/* attribute boolean loop; */

function loop_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.loop, 'boolean', "media.loop of type");
    }, name);
}

function loop_false_loop_absent()
{
    getmedia();
    test(function() {
        assert_false(media.loop, "media.loop of value");
    }, name);
}

function loop_true_loop_present()
{
    getmedia();
    test(function() {
        assert_true(media.loop, "media.loop of value");
    }, name);
}

function loop_reflects_false()
{
    getmedia();
    test(function() {
        media.loop = false;
        assert_false(media.loop, "media.loop of value");
    }, name);
}

function loop_reflects_true()
{
    getmedia();
    test(function() {
        media.loop = true;
        assert_true(media.loop, "media.loop of value");
    }, name);
}


/* attribute boolean controls; */

function controls_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.controls, 'boolean', "media.controls of type");
    }, name);
}

function controls_false_controls_absent()
{
    getmedia();
    test(function() {
        assert_false(media.controls, "media.controls of value");
    }, name);
}

function controls_true_controls_present()
{
    getmedia();
    test(function() {
        assert_true(media.controls, "media.controls of value");
    }, name);
}

function controls_reflects_false()
{
    getmedia();
    test(function() {
        media.controls = false;
        assert_false(media.controls, "media.controls of value");
    }, name);
}

function controls_reflects_true()
{
    getmedia();
    test(function() {
        media.controls = true;
        assert_true(media.controls, "media.controls of value");
    }, name);
}


/* attribute boolean defaultMuted; */

function defaultMuted_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.defaultMuted, 'boolean', "media.defaultMuted of type");
    }, name);
}

function defaultMuted_false_muted_absent()
{
    getmedia();
    test(function() {
        assert_false(media.defaultMuted, "media.defaultMuted of value");
    }, name);
}

function defaultMuted_true_muted_present()
{
    getmedia();
    test(function() {
        assert_true(media.defaultMuted, "media.defaultMuted of value");
    }, name);
}

function defaultMuted_no_dynamic_effect()
{
    getmedia();
    test(function() {
        media.muted = true;
        assert_false(media.defaultMuted, "media.defaultMuted of value");
    }, name);
}

function defaultMuted_no_dynamic_effect_muted()
{
    getmedia();
    test(function() {
        media.muted = false;
        assert_true(media.defaultMuted, "media.defaultMuted of value");
    }, name);
}


/* attribute boolean muted; */

function muted_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.muted, 'boolean', "media.muted of type");
    }, name);
}

function muted_false_muted_absent()
{
    getmedia();
    test(function() {
        assert_false(media.muted, "media.muted of value");
    }, name);
}

function muted_true_muted_present()
{
    getmedia();
    test(function() {
        assert_true(media.muted, "media.muted of value");
    }, name);
}

function muted_false_unmuted()
{
    getmedia();
    test(function() {
        media.muted = false;
        assert_false(media.muted, "media.muted of value");
    }, name);
}

function muted_true_muted()
{
    getmedia();
    test(function() {
        media.muted = true;
        assert_true(media.muted, "media.muted of value");
    }, name);
}


/* attribute double volume; */

var VOLUME = {
    'SILENT'  :  0.0,
    'NORMAL'  :  0.5,
    'LOUDEST' :  1.0,
    'LOWER'   : -1.1,
    'UPPER'   :  1.1,
};

function volume_attribute_type()
{
    getmedia();
    test(function() {
        assert_equals(typeof media.volume, 'number', "media.volume of type");
    }, name);
}

function volume_initial()
{
    getmedia();
    test(function() {
        assert_false(media.volume < VOLUME.SILENT || media.volume > VOLUME.LOUDEST, "media.volume outside the range 0.0 to 1.0 inclusive");
    }, name);
}

function volume_setting(vol)
{
    getmedia();
    var t = async_test(name);
    
    function volumeChanged() {
        t.step(function() {
            assert_equals(media.volume, vol, "media.volume new value");
        });
        t.done();
    }
    
    if (vol == media.volume) {
        media.volume = vol;
        t.step(function() {
            assert_equals(media.volume, vol, "media.volume new value");
        });
        t.done();
    } else if (vol < VOLUME.SILENT || vol > VOLUME.LOUDEST) {
        try {
            media.volume = vol;
            t.step(function() {
                assert_true(false, "media.volume setting exception");
            });
        } catch(e) {
            t.step(function() {
                // 1 should be e.IndexSizeError or e.INDEX_SIZE_ERR in previous spec
                assert_equals(e.code, 1, "media.volume setting exception");
            });
        }
        t.done();
    } else {
        media.addEventListener("volumechange", volumeChanged, false);
        media.volume = vol;
    }
}