#media sources
dataurl_src = "'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA'"

throttler = "'/media/preload.%s?pipe=trickle(100000:d1:r2)'";
mp4_src = throttler % 'mp4'
ogg_src = throttler % 'ogv'
webm_src = throttler % 'webm'

#preload="auto" event orders
auto_event_order = '/^loadstart (progress )+loadedmetadata (progress )*loadeddata (progress )*canplay (progress )*canplaythrough $/g'
auto_event_order_dataurl = '/^loadstart progress loadedmetadata loadeddata canplay canplaythrough $/g'

auto_to_none_event_order = '/^loadstart (progress )+loadedmetadata (progress )*loadeddata (progress )*canplay (progress )*canplaythrough $/g'
auto_to_none_event_order_dataurl = '/^loadstart progress loadedmetadata loadeddata canplay canplaythrough $/g'

#preload="metadata" event/state orders
metadata_event_order = '/^loadstart (progress )+loadedmetadata (progress )*loadeddata (progress )*suspend $/g'
metadata_event_order_dataurl = '/^loadstart progress loadedmetadata loadeddata suspend $/g'

metadata_event_order_play_after_suspend = '/^loadstart (progress )+loadedmetadata (progress )*loadeddata (progress )*suspend (progress )*canplay (progress )*canplaythrough $/g'
metadata_event_order_play_after_suspend_dataurl = '/^loadstart progress loadedmetadata loadeddata suspend canplay canplaythrough $/g'

metadata_networkstate_after_suspend = "HTMLMediaElement.NETWORK_IDLE"

metadata_readystate_after_suspend = "HTMLMediaElement.HAVE_CURRENT_DATA"

metadata_readystate_before_src = "HTMLMediaElement.HAVE_NOTHING"

metadata_networkstate_order = "eval('/^(' + HTMLMediaElement.NETWORK_LOADING + ' )+(' + HTMLMediaElement.NETWORK_IDLE + ' )+$/g')"
metadata_networkstate_order_dataurl = "eval('/^(' + HTMLMediaElement.NETWORK_IDLE + ' )+$/g')"

metadata_readystate_order = "eval('/^(' + HTMLMediaElement.HAVE_NOTHING + ' )+' + HTMLMediaElement.HAVE_METADATA + '(' + HTMLMediaElement.HAVE_CURRENT_DATA + ' )+$/g')"
metadata_readystate_order_dataurl = "eval('/^(' + HTMLMediaElement.HAVE_NOTHING + ' )+(' + HTMLMediaElement.HAVE_ENOUGH_DATA + ' )+$/g')"

#preload="none" event orders
none_event_order = '/^loadstart suspend $/g'
none_event_order_dataurl = none_event_order

none_event_order_play_after_suspend = '/^loadstart suspend (progress )+loadedmetadata (progress )*loadeddata (progress )*canplay (progress )*canplaythrough $/g'
none_event_order_play_after_suspend_dataurl = '/^loadstart suspend progress loadedmetadata loadeddata canplay canplaythrough $/g'

none_to_metadata_event_order = '/^loadstart suspend (progress )+loadedmetadata (progress )*loadeddata (progress )*suspend $/g'
none_to_metadata_event_order_dataurl = '/^loadstart suspend progress loadedmetadata loadeddata suspend $/g'

timeout = 10000
timeout_dataurl = 5000

testsuite = {
    '*' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'timeout' : timeout}}
        ],
    #preload="auto"
    'preload-auto-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : auto_event_order_dataurl, 'start_state' : 'auto', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : auto_event_order, 'start_state' : 'auto', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : auto_event_order, 'start_state' : 'auto', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : auto_event_order, 'start_state' : 'auto', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    #preload="metadata"
    'preload-metadata-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : metadata_event_order_dataurl, 'start_state' : 'metadata', 'end_event' : 'suspend', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : metadata_event_order, 'start_state' : 'metadata', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : metadata_event_order, 'start_state' : 'metadata', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : metadata_event_order, 'start_state' : 'metadata', 'end_event' : 'suspend', 'timeout' : timeout}}
        ],
    'preload-metadata-event-order-play-after-suspend.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : metadata_event_order_play_after_suspend_dataurl, 'start_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    'preload-metadata-networkstate-after-suspend.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'state_expected' : metadata_networkstate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'networkState', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'state_expected' : metadata_networkstate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'networkState', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'state_expected' : metadata_networkstate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'networkState', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'state_expected' : metadata_networkstate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'networkState', 'timeout' : timeout}}
        ],
    'preload-metadata-readystate-after-suspend.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'state_expected' : metadata_readystate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'readyState', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'state_expected' : metadata_readystate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'readyState', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'state_expected' : metadata_readystate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'readyState', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'state_expected' : metadata_readystate_after_suspend, 'start_state' : 'metadata', 'end_event' : 'suspend', 'test_state_type' : 'readyState', 'timeout' : timeout}}
        ],
    'preload-metadata-buffered.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'max_buffer' : '0.0001', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'max_buffer' : '60', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'max_buffer' : '60', 'timeout' : timeout}}
        ],
    'preload-metadata-to-auto-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : metadata_event_order_play_after_suspend_dataurl, 'start_state' : 'metadata', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : metadata_event_order_play_after_suspend, 'start_state' : 'metadata', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    #preload="none"
    'preload-none-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_event_order_dataurl, 'start_state' : 'none', 'end_event' : 'suspend', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_event_order, 'start_state' : 'none', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_event_order, 'start_state' : 'none', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_event_order, 'start_state' : 'none', 'end_event' : 'suspend', 'timeout' : timeout}}
        ],
    'preload-none-event-order-autoplay.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : auto_event_order_dataurl, 'start_state' : 'none', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : auto_event_order, 'start_state' : 'none', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : auto_event_order, 'start_state' : 'none', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : auto_event_order, 'start_state' : 'none', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    'preload-none-event-order-autoplay-after-suspend.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_event_order_play_after_suspend_dataurl, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    'preload-none-event-order-play-after-suspend.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_event_order_play_after_suspend_dataurl, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    'preload-none-to-auto-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_event_order_play_after_suspend_dataurl, 'start_state' : 'none', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_event_order_play_after_suspend, 'start_state' : 'none', 'end_state' : 'auto', 'start_event' : 'suspend', 'end_event' : 'canplaythrough', 'timeout' : timeout}}
        ],
    'preload-none-to-invalid-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_to_metadata_event_order_dataurl, 'start_state' : 'none', 'end_state' : 'invalid', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'invalid', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'invalid', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'invalid', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}}
        ],
    'preload-none-to-metadata-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_to_metadata_event_order_dataurl, 'start_state' : 'none', 'end_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'end_state' : 'metadata', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}}
        ],
    'preload-none-remove-attribute-event-order.tpl' : [
        {'test_suffix' : 'dataurl', 'test_mapping' : {'media_type' : 'wave', 'media_src' : dataurl_src, 'events_expected' : none_to_metadata_event_order_dataurl, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout_dataurl}},
        {'test_suffix' : 'mp4', 'test_mapping' : {'media_type' : 'mp4', 'media_src' : mp4_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'ogg', 'test_mapping' : {'media_type' : 'ogg', 'media_src' : ogg_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}},
        {'test_suffix' : 'webm', 'test_mapping' : {'media_type' : 'webm', 'media_src' : webm_src, 'events_expected' : none_to_metadata_event_order, 'start_state' : 'none', 'start_event' : 'suspend', 'end_event' : 'suspend', 'timeout' : timeout}}
        ]
    }
