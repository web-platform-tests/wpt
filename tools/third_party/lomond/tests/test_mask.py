import lomond.mask


def test_make_masking_key():
    # well, there isn't much that we can do here - it's random after all
    key = lomond.mask.make_masking_key()
    assert len(key) == 4
    assert type(key) is bytes


def test_masking():
    key = b'\xaa\xff\x7f\xf7'
    test = b'Hello, World'
    data = bytearray(test)
    lomond.mask.mask_payload(key, data)
    # Masked byte should look like gibberish
    assert data == bytearray(b'\xe2\x9a\x13\x9b\xc5\xd3_\xa0\xc5\x8d\x13\x93')
    # Apply mask again to unmask
    lomond.mask.mask_payload(key, data)
    # Result should be plain text
    assert data == test
