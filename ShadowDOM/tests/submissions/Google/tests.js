// Copyright 2012 Google Inc. All Rights Reserved.
// See LICENSE for license information.
// 
// Author: dominicc@chromium.org (Dominic Cooney)

// Test suite for Shadow DOM.
//
// This is based on the following revision of the spec:
// http://dvcs.w3.org/hg/webcomponents/raw-file/9ff70a713eef/spec/shadow/index.html

"use strict";

// Alias the constructor so vendor-prefixed implementations can run
// most of the test suite.
var SR = window.ShadowRoot ||
         window.WebKitShadowRoot ||
         // Add other vendor prefixes here.
         function () { assert_unreached('no ShadowRoot constructor'); };

// Section 5.1 Shadow DOM Subtrees, Upper-boundary Encapsulation

test(function () {
  var d = document.implementation.createHTMLDocument('test doc');
  var s = new SR(d.body);

  var span = document.createElement('span');
  s.appendChild(span);

  // getElementsByTagName
  assert_equals(d.getElementsByTagName('span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'document.getElementsByTagName');
  assert_equals(d.body.getElementsByTagName('span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'element.getElementsByTagName outside of the shadow tree');

  // getElementsByTagNameNS
  assert_equals(d.getElementsByTagNameNS(null, 'span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'document.getElementsByTagNameNS');
  assert_equals(d.body.getElementsByTagNameNS(null, 'span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'element.getElementsByTagNameNS outside of the shadow tree');

  // getElementsByClassName
  span.setAttribute('class', 'shadowy');
  assert_equals(d.getElementsByClassName('shadowy').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'document.getElementsByClassName');
  assert_equals(d.body.getElementsByClassName('shadowy').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'element.getElementsByClassName outside of the shadow tree');

  // getElementById (document)
  span.setAttribute('id', 'spandex');
  assert_equals(d.getElementById('spandex'), null,
                'elements in shadow DOM must not be exposed via ' +
                'document.getElementById');
}, 'Upper-boundary encapsulation: nodes in a shadow DOM subtree are not ' +
   'accessible using the DOM tree accessors defined in DOM4 outside the ' +
   'shadow tree');

test(function () {
  var d = document.implementation.createHTMLDocument('test doc');
  var s = new SR(d.body);

  var span = document.createElement('span');
  s.appendChild(span);

  // querySelector
  assert_equals(d.querySelector('span'), null,
                'elements in shadow DOM must not be exposed via ' +
                'document.querySelector');
  assert_equals(d.body.querySelector('span'), null,
                'elements in shadow DOM must not be exposed via ' +
                'element.querySelector outside of the shadow tree');

  // querySelectorAll
  assert_equals(d.querySelectorAll('span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'document.querySelectorAll');
  assert_equals(d.body.querySelectorAll('span').length, 0,
                'elements in shadow DOM must not be exposed via ' +
                'element.querySelectorAll outside of the shadow tree');

  assert_equals(s.querySelector('span'), span,
                'elements in shadow DOM must be returned by ' +
                'querySelector within the shadow tree');

  assert_equals(s.querySelector('body span'), null,
                'selectors must not cross the shadow boundary');
}, 'Upper-boundary encapsulation: nodes in a shadow DOM subtree are not ' +
   'accessible using the DOM tree accessors defined in Selectors API ' +
   'outside the shadow tree');

// TODO(dcooney): Test DOM4 TreeWalker, NodeIterator for upper
// boundary encapsulation

// TODO(dcooney): MutationRecord upper boundary encapsulation
// (addedNodes, removedNodes)

var t = async_test('Upper-boundary encapsulation: nodes in a shadow DOM ' +
                   'subtree are not accessible using the shadow host ' +
                   'document\'s CSSOM extensions');

t.step(function () {
  var iframe = document.createElement('iframe');
  iframe.src = 'blank.html';
  document.body.appendChild(iframe);
  iframe.onload = t.step_func(function () {
    try {
      var d = iframe.contentDocument;
      var s = new SR(d.head);
      var style = d.createElement('style');
      s.appendChild(style);
      assert_equals(d.styleSheets.length, 0,
                    'style elements in shadow DOM must not be exposed via ' +
                    'the document.styleSheets attribute');

      var link = d.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', '../../../../../resources/testharness.css');
      s.appendChild(link);
      assert_equals(d.styleSheets.length, 0,
                    'stylesheet link elements in shadow DOM must not be ' +
                    'exposed via the document.styleSheets attribute');
    } finally {
      iframe.parentNode.removeChild(iframe);
    }
    t.done();
  });
});

test(function () {
  var d = document.implementation.createHTMLDocument('test doc');
  var s = new SR(d.documentElement);
  var namedElements = ['a', 'applet', 'area', 'embed', 'form', 'frame',
                       'frameset', 'iframe', 'img', 'object'];
  namedElements.forEach(function (tagName) {
    var element = d.createElement(tagName);
    element.name = 'named' + tagName;
    s.appendChild(element);
    assert_true(!(element.name in window),
                'named ' + tagName + ' must not appear in window object ' +
                'named properties');
  });

  var f = d.createElement('div');
  f.id = 'divWithId';
  s.appendChild(f);
  assert_true(!('divWithId' in window),
              'element with ID must not appear in window object named ' +
              'properties');
}, 'Upper-boundary encapsulation: nodes in a shadow DOM subtree are not ' +
   'accessible with Window object named properties');

test(function () {
  var d = document.implementation.createHTMLDocument('what\'s up, doc?');

  // head, title, body

  var s = new SR(d.documentElement);
  s.appendChild(d.head);
  s.appendChild(d.body);

  assert_equals(d.head, null, 'head in shadow DOM must not be exposed ' +
                              'via the document.head DOM accessor');

  assert_equals(d.title, '', 'title text in shadow DOM must not be ' +
                             'exposed via document.title DOM accessor');

  assert_equals(d.body, null, 'body in shadow DOM must not be exposed ' +
                              'via the document.body DOM accessor');

  // images, embeds, plugins, links, forms, scripts

  var e = d.createElement('img');
  s.appendChild(e);
  assert_equals(d.images.length, 0,
                'images in shadow DOM must not be exposed via the ' +
                'document.images DOM accessor');

  e = d.createElement('embed');
  s.appendChild(e);
  assert_equals(d.embeds.length, 0,
                'embeds in shadow DOM must not be exposed via the ' +
                'document.embeds DOM accessor');
  assert_equals(d.plugins.length, 0,
                'embeds in shadow DOM must not be exposed via the ' +
                'document.plugins DOM accessor');

  e = d.createElement('a');
  e.setAttribute('href', 'http://www.w3.org/');
  s.appendChild(e);
  assert_equals(d.links.length, 0,
                'a elements with href attributes in shadow DOM must not ' +
                'be exposed via the document.links DOM accessor');
  e = d.createElement('area');
  e.setAttribute('href', 'http://www.w3.org/');
  s.appendChild(e);
  assert_equals(d.links.length, 0,
                'area elements with href attributes in shadow DOM must ' +
                'not be exposed via the document.links DOM accessor');

  e = d.createElement('form');
  s.appendChild(e);
  assert_equals(d.forms.length, 0,
                'form elements in shadow DOM must not be exposed via the ' +
                'document.forms DOM accessor');

  e = d.createElement('script');
  s.appendChild(e);
  assert_equals(d.scripts.length, 0,
                'script elements in shadow DOM must not be exposed via ' +
                'the document.scripts DOM accessor');

  // getElementsByName

  e = d.createElement('div');
  e.setAttribute('name', 'bob');
  s.appendChild(e);
  assert_equals(d.getElementsByName('bob').length, 0,
                'elements in shadow DOM must not be exposed via the ' +
                'getElementsByName DOM accessor');

  // cssElementMap
  // named: applet, exposed embed, form, iframe, exposed object
  // id: applet, exposed object

  // img, video and canvas elements created by the document are
  // exposed in cssElementMap even if they are not in the document

  // TODO(dcooney): cssElementMap is not widely implemented, so not
  // tested yet.
}, 'Upper-boundary encapsulation: nodes in a shadow DOM subtree are not ' +
   'accessible using the shadow host\'s document DOM tree accessors ' +
   'defined in HTML');

test(function () {
  var d = document.implementation.createHTMLDocument('test doc');
  var s = new SR(d.body);
  assert_equals(s.parentNode, null, 'the parentNode attribute of the shadow ' +
                                    'root object must always return null');
  assert_equals(s.parentElement, null,
                'the parentElement attribute of the shadow root object ' +
                'must always return null');
}, 'Upper-boundary encapsulation: attributes of the shadow root object');

// TODO(dcooney): Add assertions for the rest of the spec.

// TODO(dcooney): Add an IDL test to check other IDL attributes
test(function () {
  assert_true('ShadowRoot' in window,
              'there must be a ShadowRoot constructor defined on the ' +
              'window');
}, 'ShadowRoot constructor');
