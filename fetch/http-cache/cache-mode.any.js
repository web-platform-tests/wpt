// META: global=window,worker
// META: title=Fetch - Cache Mode
// META: timeout=long
// META: script=/common/utils.js
// META: script=/common/get-host-info.sub.js
// META: script=http-cache.js

// 4.6. HTTP-network-or-cache fetch
// https://fetch.spec.whatwg.org/#http-network-or-cache-fetch
var tests = [
  // 15. If httpRequest's cache mode is "default"
  // and httpRequest's header list contains
  // `If-Modified-Since`, `If-None-Match`, `If-Unmodified-Since`, `If-Match`, or `If-Range`,
  // then set httpRequest's cache mode to "no-store".

  /// If-Modified-Since
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is default and header list contains If-Modified-Since",
    requests: [
      {
        cache: "default",
        request_headers: [['if-modified-since', 'Tue, 22 Feb 2022 22:22:22 GMT']],
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Modified-Since and Cache-Control is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-modified-since', 'Tue, 22 Feb 2022 22:22:22 GMT'],
          ['cache-control', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'foo']
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Modified-Since and Pragma is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-modified-since', 'Tue, 22 Feb 2022 22:22:22 GMT'],
          ['pragma', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'no-cache']
          ['pragma', 'foo']
        ]
      }
    ]
  },

  /// If-Unmodified-Since
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is default and header list contains If-Unmodified-Since",
    requests: [
      {
        cache: "default",
        request_headers: [['if-unmodified-since', 'Tue, 22 Feb 2022 22:22:22 GMT']],
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Unmodified-Since and Cache-Control is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-unmodified-since', 'Tue, 22 Feb 2022 22:22:22 GMT'],
          ['cache-control', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'foo']
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Unmodified-Since and Pragma is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-unmodified-since', 'Tue, 22 Feb 2022 22:22:22 GMT'],
          ['pragma', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'no-cache']
          ['pragma', 'foo']
        ]
      }
    ]
  },

  /// If-Match
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is default and header list contains If-Match",
    requests: [
      {
        cache: "default",
        request_headers: [['if-match', 'foo']],
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Match and Cache-Control is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-match', 'foo'],
          ['cache-control', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'foo']
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Match and Pragma is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-match', 'foo'],
          ['pragma', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'no-cache']
          ['pragma', 'foo']
        ]
      }
    ]
  },

  /// If-Range
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is default and header list contains If-Range",
    requests: [
      {
        cache: "default",
        request_headers: [['if-range', 'foo']],
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Range and Cache-Control is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-range', 'foo'],
          ['cache-control', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'foo']
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is default, header list contains If-Range and Pragma is already present",
    requests: [
      {
        cache: "default",
        request_headers: [
          ['if-range', 'foo'],
          ['pragma', 'foo']
        ],
        expected_request_headers: [
          ['cache-control', 'no-cache']
          ['pragma', 'foo']
        ]
      }
    ]
  },

  // 16. If httpRequest's cache mode is "no-cache",
  //     httpRequest's prevent no-cache cache-control header modification flag is unset,
  //     and httpRequest's header list does not contain `Cache-Control`,
  //     then append (`Cache-Control`, `max-age=0`) to httpRequest's header list.
  {
    name: "Fetch sends Cache-Control: max-age=0 when cache mode is no-cache",
    requests: [
      {
        cache: "no-cache",
        expected_request_headers: [['cache-control', 'max-age=0']]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is no-cache and Cache-Control is already present",
    requests: [
      {
        cache: "no-cache",
        request_headers: [['cache-control', 'foo']],
        expected_request_headers: [['cache-control', 'foo']]
      }
    ]
  },

  // 17. If httpRequest's cache mode is "no-store" or "reload", then:
  //    1. If httpRequest's header list does not contain `Pragma`,
  //       then append (`Pragma`, `no-cache`) to httpRequest's header list.
  //    2. If httpRequest's header list does not contain `Cache-Control`,
  //        then append (`Cache-Control`, `no-cache`) to httpRequest's header list.

  // mode: "no-store"
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is no-store",
    requests: [
      {
        cache: "no-store",
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is no-store and Cache-Control is already present",
    requests: [
      {
        cache: "no-store",
        request_headers: [['cache-control', 'foo']],
        expected_request_headers: [['cache-control', 'foo']]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Pragma when cache mode is no-store and Pragma is already present",
    requests: [
      {
        cache: "no-store",
        request_headers: [['pragma', 'foo']],
        expected_request_headers: [['pragma', 'foo']]
      }
    ]
  },

  // mode: "reload"
  {
    name: "Fetch sends Cache-Control: no-cache and Pragma: no-cache when cache mode is reload",
    requests: [
      {
        cache: "reload",
        expected_request_headers: [
          ['cache-control', 'no-cache'],
          ['pragma', 'no-cache']
        ]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Cache-Control when cache mode is reload and Cache-Control is already present",
    requests: [
      {
        cache: "reload",
        request_headers: [['cache-control', 'foo']],
        expected_request_headers: [['cache-control', 'foo']]
      }
    ]
  },
  {
    name: "Fetch doesn't touch Pragma when cache mode is reload and Pragma is already present",
    requests: [
      {
        cache: "reload",
        request_headers: [['pragma', 'foo']],
        expected_request_headers: [['pragma', 'foo']]
      }
    ]
  }
];
run_tests(tests);
