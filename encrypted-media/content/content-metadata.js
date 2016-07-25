content = addMemberListToObject( {
    'mp4-basic' : {     initDataType:       'cenc',                             // This is the type of the embedded initData
                        audio : {   type:   'audio/mp4;codecs="mp4a.40.2"',
                                    path:   '/encrypted-media/content/audio_aac-lc_128k_dashinit.mp4' },
                        video : {   type:   'video/mp4;codecs="avc1.4d401e"',
                                    path:   '/encrypted-media/content/video_512x288_h264-360k_dashinit.mp4' },
                        keys :  [ ]
                    },
    
    'mp4-chimera' : {   initDataType:       'cenc',
                        audio : {   type:   'audio/mp4;codecs="mp4a.40.5"',
                                    path:   '/encrypted-media/content/chimera_audio.mp4' },
                        video : {   type:   'video/mp4;codecs="avc1.4D4028"',
                                    path:   '/encrypted-media/content/chimera_video.mp4' },
                        keys :  [ { kid:    [   0x00, 0x00, 0x00, 0x00, 0x03, 0xd2, 0xfc, 0x41,
                                                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],
                                    key:    [ 175, 52, 19, 73, 31, 172, 44, 62, 58, 107, 136, 224, 83, 132, 66, 6 ] } ]
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
        