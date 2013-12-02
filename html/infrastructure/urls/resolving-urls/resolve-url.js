setup({explicit_done:true});
onload = function() {
  var input_url = 'resource.py?q=\u00E5';
  var input_url_html = input_url + '&type=html';
  var input_url_css = input_url + '&type=css';
  var input_url_png = input_url + '&type=png';
  var input_url_svg = input_url + '&type=svg';
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
      var expected = expected_current;
      assert_true(got.indexOf(expected) > -1, msg(expected, got));
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
    var expected = expected_current;
    if (multiple) {
      input += ' ' + input;
    }
    test(function() {
      var elm = document.createElement(tag);
      assert_true(idlAttr in elm, idlAttr + ' is not supported');
      elm.setAttribute(attr, input);
      var got = elm[idlAttr];
      assert_true(got.indexOf(expected) > -1, msg(expected, got));
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

  // loading css
  // <link href>
  // <link>.sheet.href

  // loading js
  // <script src>

  // loading image
  // <style> background </style>
  // <img src>
  // <img srcset>
  // <embed src>
  // <object data>
  // <input type=image src>
  // <menuitem icon>

  // loading video
  // <video src>
  // <audio src>

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
  //
  // step 4:
  // all the things that give a base url
  // element
  // element + <base>
  // element + xml:base
  done();
};
