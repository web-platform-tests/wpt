content = addMemberListToObject( {
    'mp4-basic' : {     initDataType:       'cenc',                             // This is the type of the embedded initData
                        audio : {   type:   'audio/mp4;codecs="mp4a.40.2"',
                                    path:   '/encrypted-media/content/audio_aac-lc_128k_dashinit.mp4' },
                        video : {   type:   'video/mp4;codecs="avc1.4d401e"',
                                    path:   '/encrypted-media/content/video_512x288_h264-360k_enc_dashinit.mp4' },
                        keys :  [ { kid: [ 0xad, 0x13, 0xf9, 0xea, 0x2b, 0xe6, 0x98, 0xb8, 0x75, 0xf5, 0x04, 0xa8, 0xe3, 0xcc, 0xea, 0x64 ],
                                    key: [ 0xbe, 0x7d, 0xf8, 0xa3, 0x66, 0x7a, 0x6a, 0x8f, 0xd5, 0x64, 0xd0, 0xed, 0x81, 0x33, 0x9a, 0x95 ] } ],
                        initData: { 'com.widevine.alpha' : 'AAAAcXBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAAFEIARIQrRP56ivmmLh19QSo48zqZBoIY2FzdGxhYnMiKGV5SmhjM05sZEVsa0lqb2laVzFsTFhSbGMzUXRjMmx1WjJ4bEluMD0yB2RlZmF1bHQ=',
                                    'com.microsoft.playready' : 'AAADGnBzc2gAAAAAmgTweZhAQoarkuZb4IhflQAAAvr6AgAAAQABAPACPABXAFIATQBIAEUAQQBEAEUAUgAgAHgAbQBsAG4AcwA9ACIAaAB0AHQAcAA6AC8ALwBzAGMAaABlAG0AYQBzAC4AbQBpAGMAcgBvAHMAbwBmAHQALgBjAG8AbQAvAEQAUgBNAC8AMgAwADAANwAvADAAMwAvAFAAbABhAHkAUgBlAGEAZAB5AEgAZQBhAGQAZQByACIAIAB2AGUAcgBzAGkAbwBuAD0AIgA0AC4AMAAuADAALgAwACIAPgA8AEQAQQBUAEEAPgA8AFAAUgBPAFQARQBDAFQASQBOAEYATwA+ADwASwBFAFkATABFAE4APgAxADYAPAAvAEsARQBZAEwARQBOAD4APABBAEwARwBJAEQAPgBBAEUAUwBDAFQAUgA8AC8AQQBMAEcASQBEAD4APAAvAFAAUgBPAFQARQBDAFQASQBOAEYATwA+ADwASwBJAEQAPgA2AHYAawBUAHIAZQBZAHIAdQBKAGgAMQA5AFEAUwBvADQAOAB6AHEAWgBBAD0APQA8AC8ASwBJAEQAPgA8AEMASABFAEMASwBTAFUATQA+AGoAWQBGAE4AZgAwAHkAZgA0AGkAcwA9ADwALwBDAEgARQBDAEsAUwBVAE0APgA8AEwAQQBfAFUAUgBMAD4AaAB0AHQAcAA6AC8ALwBwAGwAYQB5AHIAZQBhAGQAeQAuAGQAaQByAGUAYwB0AHQAYQBwAHMALgBuAGUAdAAvAHAAcgAvAHMAdgBjAC8AcgBpAGcAaAB0AHMAbQBhAG4AYQBnAGUAcgAuAGEAcwBtAHgAPwBQAGwAYQB5AFIAaQBnAGgAdAA9ADEAJgBhAG0AcAA7AFUAcwBlAFMAaQBtAHAAbABlAE4AbwBuAFAAZQByAHMAaQBzAHQAZQBuAHQATABpAGMAZQBuAHMAZQA9ADEAPAAvAEwAQQBfAFUAUgBMAD4APAAvAEQAQQBUAEEAPgA8AC8AVwBSAE0ASABFAEEARABFAFIAPgA=' }
                    },
    
    'webm' :        {   audio : {   type:   'audio/webm; codecs="opus"' },
                        video : {   type:   'video/webm; codecs="vp8"',
                                    path:   '/encrypted-media/content/test-encrypted.webm' },
                        keys :  [ { kid:    [48,49,50,51,52,53,54,55,56,57,48,49,50,51,52,53],
                                    key:    [0xeb, 0xdd, 0x62, 0xf1, 0x68, 0x14, 0xd2, 0x7b,
                                             0x68, 0xef, 0x12, 0x2a, 0xfc, 0xe4, 0xae, 0x3c ] } ]
                    },
    'webm-multikey' :
                    {   audio : {   type:   'audio/webm; codecs="opus"' },
                        video : {   type:   'video/webm; codecs="vp8"',
                                    path:   '/encrypted-media/content/test-encrypted-different-av-keys.webm' },
                        keys :  [ { kid:    [48,49,50,51,52,53,54,55,56,57,48,49,50,51,52,53],
                                    key:    [   0x7A, 0x7A, 0x62, 0xF1, 0x68, 0x14, 0xD2, 0x7B,
                                                0x68, 0xEF, 0x12, 0x2A, 0xFC, 0xE4, 0xAE, 0x0A ] },
                                  { kid:    [49,50,51,52,53,54,55,56,57,48,49,50,51,52,53,54],
                                    key:    [   0x30, 0x30, 0x62, 0xF1, 0x68, 0x14, 0xD2, 0x7B,
                                                0x68, 0xEF, 0x12, 0x2A, 0xFC, 0xE4, 0xAE, 0x0A ] } ]
                    },
                    
} );

function addMemberListToObject( o )
{
    var items = [ ];
    for( var item in o )
    {
        if ( !o.hasOwnProperty( item ) ) continue;
        
        o[item].name = item;
        items.push( o[item] );
    }
    
    o._items = items;
    
    return o;
}

function getInitData( contentitem, initDataType )
{
    if (initDataType == 'webm') {
      return new Uint8Array( contentitem.keys[ 0 ].kid );       // WebM initData supports only a single key
    }

    if (initDataType == 'cenc') {
        
        var size = 36 + contentitem.keys.length * 16,
            kids = contentitem.keys.map( function( k ) { return k.kid; } );
        
        return new Uint8Array(Array.prototype.concat.call( [
            0x00, 0x00, size / 256, size % 256, // size
            0x70, 0x73, 0x73, 0x68, // 'pssh'
            0x01, // version = 1
            0x00, 0x00, 0x00, // flags
            0x10, 0x77, 0xEF, 0xEC, 0xC0, 0xB2, 0x4D, 0x02, // Common SystemID
            0xAC, 0xE3, 0x3C, 0x1E, 0x52, 0xE2, 0xFB, 0x4B,
            0x00, 0x00, 0x00, kids.length ], // key count ]
            Array.prototype.concat.apply( [], kids ),
          [ 0x00, 0x00, 0x00, 0x00 ]// datasize
        ));
    }
    if (initDataType == 'keyids') {

        return toUtf8( { kids: contentitem.keys.map( function( k ) { return base64urlEncode( new Uint8Array( k.kid ) ); } ) } );
    }
    throw 'initDataType ' + initDataType + ' not supported.';
}

// Returns a promise that resolves to true or false depending on whether the content is supported with the key system and one of the initDataTypes
function isContentSupportedForInitDataTypes( keysystem, intiDataTypes, contentitem )
{
    var configuration = {   initDataTypes : intiDataTypes,
                            audioCapabilities: [ { contentType: contentitem.audio.type } ],
                            videoCapabilities: [ { contentType: contentitem.video.type } ]
                        };
    return navigator.requestMediaKeySystemAccess( keysystem, [ configuration ] )
    .then(function() { return true; }, function() { return false; } );
}

// Returns a promise that resolves to true or false depending on whether the content is supported with the key system
function isContentSupported( keysystem, contentitem )
{
    return isContentSupportedForInitDataTypes( keysystem, [ 'cenc', 'webm', 'keyids' ], contentitem );
}

// returns a Promise resolving to an array of supported content for the key system
function getSupportedContent( keysystem )
{
    return Promise.all( content._items.map( isContentSupported.bind( null, keysystem ) ) ).
    then( function( supported )
    {
        return content._items.filter( function( item, i ) { return supported[ i ] && item.keys.length > 0; } );
    } );
}

// gets a configuration object for provided piece of content
function getSimpleConfigurationForContent( contentitem )
{
    return {    initDataTypes: [ 'keyids', 'webm', 'cenc' ],
                audioCapabilities: [ { contentType: contentitem.audio.type } ],
                videoCapabilities: [ { contentType: contentitem.video.type } ] };
}
        