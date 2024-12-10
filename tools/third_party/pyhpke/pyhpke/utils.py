import base64


def xor_bytes(b1: bytes, b2: bytes) -> bytes:
    return bytes([a1 ^ a2 for (a1, a2) in zip(b1, b2)])


def base64url_decode(v: str) -> bytes:
    bv = v.encode("ascii")
    rem = len(bv) % 4
    if rem > 0:
        bv += b"=" * (4 - rem)
    return base64.urlsafe_b64decode(bv)


def base64url_encode(input: bytes) -> bytes:
    return base64.urlsafe_b64encode(input).replace(b"=", b"")
