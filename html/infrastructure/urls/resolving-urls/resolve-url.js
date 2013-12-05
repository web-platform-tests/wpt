setup({explicit_done:true});
onload = function() {
  var input_url = 'resource.py?q=\u00E5';
  var input_url_html = input_url + '&type=html';
  var input_url_css = input_url + '&type=css';
  var input_url_js = input_url + '&type=js';
  var input_url_png = input_url + '&type=png';
  var input_url_svg = input_url + '&type=svg';
  var input_url_video = input_url + '&type=video';
  var expected_utf8 = '?q=%C3%A5';
  var expected_1252 = '?q=%E5';
  var expected_error_url = '?q=%3F';
  var expected_error_form = '?q=%26%23229%3B';
  var expected_current = expected_{{GET[expected]}};

  function msg(expected, got) {
    return 'expected substring '+expected+' got '+got;
  }

  // background attribute, check with getComputedStyle
  function test_background(tag) {
    var spec_url = 'http://www.whatwg.org/specs/web-apps/current-work/multipage/rendering.html';
    spec_url += tag == 'body' ? '#the-page' : '#tables';
    test(function() {
      var elm = document.createElement(tag);
      document.body.appendChild(elm);
      this.add_cleanup(function() {
        document.body.removeChild(elm);
      });
      elm.setAttribute('background', input_url_png);
      var got = getComputedStyle(elm).backgroundImage;
      assert_true(got.indexOf(expected_current) > -1, msg(expected_current, got));
    }, 'getComputedStyle <'+tag+' background>',
    {help:spec_url});
  }

  'body, table, thead, tbody, tfoot, tr, td, th'.split(', ').forEach(function(str) {
    test_background(str);
  });

  // get a reflecting IDL attributes whose content attribute takes a URL or a list of space-separated URLs
  function test_reflecting(tag, attr, idlAttr, multiple) {
    idlAttr = idlAttr || attr;
    var input = input_url_html;
    if (multiple) {
      input += ' ' + input;
    }
    test(function() {
      var elm = document.createElement(tag);
      assert_true(idlAttr in elm, idlAttr + ' is not supported');
      elm.setAttribute(attr, input);
      var got = elm[idlAttr];
      assert_true(got.indexOf(expected_current) > -1, msg(expected_current, got));
    }, 'Getting <'+tag+'>.'+idlAttr + (multiple ? ' (multiple URLs)' : ''),
    {help:'http://www.whatwg.org/specs/web-apps/current-work/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes'});
  }

  ('iframe src, a href, base href, link href, img src, embed src, object data, track src, video src, audio src, input src, form action, ' +
  'input formaction formAction, button formaction formAction, menuitem icon, script src, div itemid').split(', ').forEach(function(str) {
    var arr = str.split(' ');
    test_reflecting(arr[0], arr[1], arr[2]);
  });

  'a ping'.split(', ').forEach(function(str) {
    var arr = str.split(' ');
    test_reflecting(arr[0], arr[1], arr[2], true);
  });

  function setup_navigation(elm, iframe, id, test_obj) {
    iframe.name = id;
    elm.target = id;
    elm.setAttribute('href', input_url_html);
    document.body.appendChild(iframe);
    document.body.appendChild(elm);
    test_obj.add_cleanup(function() {
      document.body.removeChild(iframe);
      document.body.removeChild(elm);
    });
  }

  // follow hyperlink
  function test_follow_link(tag) {
    async_test(function() {
      var elm = document.createElement(tag);
      var iframe = document.createElement('iframe');
      setup_navigation(elm, iframe, 'test_follow_link_'+tag, this);
      iframe.onload = this.step_func(function() { // when the page navigated to has loaded
        assert_equals(iframe.contentDocument.body.textContent, expected_current.substr(3));
        this.done();
      });
      // follow the hyperlink
      elm.click();
      // check that navigation succeeded by ...??? XXX
    }, 'follow hyperlink <'+tag+' href>',
    {help:'http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#following-hyperlinks'});
  }

  'a, area, link'.split(', ').forEach(function(str) {
    test_follow_link(str);
  });

  // follow hyperlink with ping attribute
  function test_follow_link_ping(tag) {
    async_test(function() {
      var uuid = token();
      var elm = document.createElement(tag);
      // check if ping is supported
      assert_true('ping' in elm, 'ping not supported');
      elm.setAttribute('ping', 'stash.py?q=\u00E5&id='+uuid+'&action=put');
      var iframe = document.createElement('iframe');
      setup_navigation(elm, iframe, 'test_follow_link_ping_'+tag, this);
      // follow the hyperlink
      elm.click();
      // check that navigation succeeded by ...??? XXX
      // check that the right URL was requested for the ping
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'stash.py?id='+uuid+'&action=take');
      xhr.onload = this.step_func(function(e) {
        assert_equals(xhr.response, expected_current.substr(3));
        this.done();
      });
      xhr.send();
    }, 'hyperlink auditing <'+tag+' ping>',
    {help:'http://www.whatwg.org/specs/web-apps/current-work/multipage/links.html#hyperlink-auditing'});
  }

  'a, area'.split(', ').forEach(function(str) {
    test_follow_link_ping(str);
  });

  // navigating with meta refresh
  async_test(function() {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    this.add_cleanup(function() {
      document.body.removeChild(iframe);
    });
    var doc = iframe.contentDocument;
    doc.write('<meta http-equiv=refresh content="0; URL='+input_url_html+'">REFRESH');
    doc.close();
    iframe.onload = this.step_func(function() {
      var got = iframe.contentDocument.body.textContent;
      if (got == 'REFRESH') {
        return;
      }
      assert_equals(got, expected_current.substr(3));
      this.done();
    });
  }, 'meta refresh',
  {help:'http://www.whatwg.org/specs/web-apps/current-work/multipage/semantics.html#attr-meta-http-equiv-refresh'});

  // loading html (or actually svg to support <embed>)
  function test_load_nested_browsing_context(tag, attr, spec_url) {
    async_test(function() {
      var id = 'test_load_nested_browsing_context_'+tag;
      var elm = document.createElement(tag);
      elm.setAttribute(attr, input_url_svg);
      elm.name = id;
      document.body.appendChild(elm);
      this.add_cleanup(function() {
        document.body.removeChild(elm);
      });
      elm.onload = this.step_func(function() {
        assert_equals(window[id].document.documentElement.textContent, expected_current.substr(3));
        this.done();
      });

    }, 'load nested browsing context <'+tag+' '+attr+'>',
    {help:spec_url});
  }

  spec_url_load_nested_browsing_context = {
    frame:'http://www.whatwg.org/specs/web-apps/current-work/multipage/obsolete.html#process-the-frame-attributes',
    iframe:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#process-the-iframe-attributes',
    object:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#the-object-element',
    embed:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#the-embed-element-setup-steps'
  };

  'frame src, iframe src, object data, embed src'.split(', ').forEach(function(str) {
    var arr = str.split(' ');
    test_load_nested_browsing_context(arr[0], arr[1], spec_url_load_nested_browsing_context[arr[0]]);
  });

  // loading css with <link>
  async_test(function() {
    var elm = document.createElement('link');
    elm.href = input_url_css;
    elm.rel = 'stylesheet';
    document.head.appendChild(elm);
    this.add_cleanup(function() {
      document.head.removeChild(elm);
    });
    elm.onload = this.step_func(function() {
      var got = elm.sheet.href;
      assert_true(elm.sheet.href.indexOf(expected_current) > -1, 'sheet.href ' + msg(expected_current, got));
      assert_equals(elm.sheet.cssRules[0].style.content, '"'+expected_current.substr(3)+'"', 'sheet.cssRules[0].style.content');
      this.done();
    });
  }, 'loading css <link>',
  {help:['http://www.whatwg.org/specs/web-apps/current-work/multipage/semantics.html#the-link-element',
         'http://www.whatwg.org/specs/web-apps/current-work/multipage/semantics.html#styling']});

  // loading js
  async_test(function() {
    var elm = document.createElement('script');
    elm.src = input_url_js + '&var=test_load_js_got';
    document.head.appendChild(elm); // no cleanup
    elm.onload = this.step_func(function() {
      assert_equals(window.test_load_js_got, expected_current.substr(3));
      this.done();
    });
  }, 'loading js <script>',
  {help:'http://www.whatwg.org/specs/web-apps/current-work/multipage/scripting-1.html#prepare-a-script'});

  // loading image
  function test_load_image(tag, attr, spec_url) {
    async_test(function() {
      var elm = document.createElement(tag);
      if (tag == 'input') {
        elm.type = 'image';
      }
      elm.setAttribute(attr, input_url_png);
      document.body.appendChild(elm);
      this.add_cleanup(function() {
        document.body.removeChild(elm);
      });
      elm.onload = this.step_func(function() {
        var got = elm.offsetWidth;
        var expected = expected_current.substr(3);
        assert_equals(got, query_to_image_width[expected], msg(expected, image_width_to_query[got]));
        this.done();
      });
      // <video poster> doesn't notify when the image is loaded so we need to poll :-(
      var interval;
      var check_video_width = function() {
        var width = elm.offsetWidth;
        if (width != 300 && width != 0) {
          clearInterval(interval);
          elm.onload();
        }
      }
      if (tag == 'video') {
        interval = setInterval(check_video_width, 10);
      }
    }, 'loading image <'+tag+' '+attr+'>',
    {help:spec_url});
  }

  var query_to_image_width = {
    '%E5':1,
    '%C3%A5':2,
    '%3F':16,
    'unknown query':256,
    'default intrinsic width':300
  };

  var image_width_to_query = {};
  (function() {
    for (var x in query_to_image_width) {
      image_width_to_query[query_to_image_width[x]] = x;
    }
  })();

  var spec_url_load_image = {
    img:'http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#update-the-image-data',
    embed:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#the-embed-element-setup-steps',
    object:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#the-object-element',
    input:'http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#image-button-state-(type=image)',
    video:'http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#poster-frame'
  };

  'img src, embed src, object data, input src, video poster'.split(', ').forEach(function(str) {
    var arr = str.split(' ');
    test_load_image(arr[0], arr[1], spec_url_load_image[arr[0]]);
  });

  // XXX test <img srcset> or its successor
  // <menuitem icon> could also be tested but the spec doesn't require it to be loaded...

  // loading video
  function test_load_video(tag) {
    async_test(function() {
      var elm = document.createElement(tag);
      var video_ext = '';
      if (elm.canPlayType('video/ogg; codecs="theora,vorbis"')) {
        video_ext = 'ogv';
      } else if (elm.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')) {
        video_ext = 'mp4';
      }
      assert_not_equals(video_ext, '', 'no supported video format');
      elm.src = input_url_video + '&ext=' + video_ext;
      elm.preload = 'auto';
      this.add_cleanup(function() {
        elm.removeAttribute('src');
        elm.load();
      });
      elm.onloadedmetadata = this.step_func(function() {
        var got = Math.round(elm.duration);
        var expected = expected_current.substr(3);
        assert_equals(got, query_to_video_duration[expected], msg(expected, video_duration_to_query[got]));
        this.done();
      });
    }, 'loading video <'+tag+'>');
  }

  var query_to_video_duration = {
    '%E5':3,
    '%C3%A5':5,
    '%3F':30,
    'unknown query':300,
    'Infinity':Infinity,
    'NaN':NaN
  };

  var video_duration_to_query = {};
  (function() {
    for (var x in query_to_video_duration) {
      video_duration_to_query[query_to_video_duration[x]] = x;
    }
  })();

  'video, audio'.split(', ').forEach(function(str) {
    test_load_video(str);
  });

  // loading webvtt
  // <track src>

  // downloading
  // <a href download>
  // <area href download>

  // submit forms
  // <form action>
  // <input type=submit formaction>
  // <button formaction>

  // other
  // <base href>
  // itemid
  // microdata values (<a href> etc)
  // drag and drop (<a href> or <img src>)
  // Worker()
  // SharedWorker()
  // EventSource()
  //
  // UTF-8:
  // XHR
  // in a worker
  // WebSocket()
  // WebSocket#url
  // Parsing cache manifest?
  // XMLDocument#load()
  // CSS background-image, @import, content, etc.
  //
  // step 4:
  // all the things that give a base url
  // element
  // element + <base>
  // element + xml:base
  done();
};
