test(t => {
  let xhr = new XMLHttpRequest();
  xhr.onprogress = t.unreached_func('progress event should not be fired');
  xhr.open('GET', 'resources/trickle.py?count=4&delay=150');
  xhr.send();
}, 'progress event should not be fired by sync XHR');
