// META: title=set() reverts state on serialization size overflow

/*
 * If the JSON serialization during a `set(key, value)` operation exceeds the configured buffer length, the state must be reverted by removing the newly added key from the internal map.
 */

let _internal_map = {};
let _configured_buffer_length = 0;

function initialize(size) {
  _configured_buffer_length = size;
  _internal_map = {};
}

function set(key, value) {
  _internal_map[key] = value;
  if (JSON.stringify(_internal_map).length > _configured_buffer_length) {
    delete _internal_map[key];
    throw new DOMException('Serialization size overflow', 'NotAllowedError');
  }
}

test(() => {
  initialize(16);
  
  // The JSON serialization of {"a":"a"} is 9 bytes.
  set('a', 'a');
  
  // The JSON serialization of {"a":"a","b":"b"} is 17 bytes, which exceeds the buffer length of 16.
  assert_throws_dom('NotAllowedError', () => {
    set('b', 'b');
  });
  
  // If 'b' was properly removed, the map is back to {"a":"a"}.
  // Adding 'c': '' makes the map {"a":"a","c":""}, whose JSON serialization is exactly 16 bytes.
  // This must succeed without throwing, proving 'b' was removed.
  set('c', '');
}, "set() reverts state on serialization size overflow");