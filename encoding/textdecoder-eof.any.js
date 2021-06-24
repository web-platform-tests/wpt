test(() => {
  assert_equals(new TextDecoder().decode(new Uint8Array([0xF0])), "\uFFFD");
  assert_equals(new TextDecoder().decode(new Uint8Array([0xF0, 0x9F])), "\uFFFD");
  assert_equals(new TextDecoder().decode(new Uint8Array([0xF0, 0x9F, 0x92])), "\uFFFD");
}, "TextDecoder end-of-queue handling");
