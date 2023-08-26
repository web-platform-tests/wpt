test(function() {
  const iframe =
      document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe');
  document.body.appendChild(iframe);

  // Create AudioContext and AudioNode from iframe
  const context = new iframe.contentWindow.AudioContext();
  const source = context.createOscillator();
  source.connect(context.destination);

  // https://webaudio.github.io/web-audio-api/#dom-audiocontext-close
  // 3. If this control message is being run in a reaction to the document being
  // unloaded, abort this algorithm.
  // There is no need to notify the control thread in this case.
  document.body.removeChild(iframe);
  // Context will remain in initial state
  assert_equals(context.state, 'suspended');
}, 'Call a constructor from iframe page and then destroy the iframe');
