import base64
import hashlib
import itertools
import secrets


__all__ = ["accept_key", "apply_mask"]


GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def generate_key() -> str:
    """
    Generate a random key for the Sec-WebSocket-Key header.

    """
    key = secrets.token_bytes(16)
    return base64.b64encode(key).decode()


def accept_key(key: str) -> str:
    """
    Compute the value of the Sec-WebSocket-Accept header.

    :param key: value of the Sec-WebSocket-Key header

    """
    sha1 = hashlib.sha1((key + GUID).encode()).digest()
    return base64.b64encode(sha1).decode()


def apply_mask(data: bytes, mask: bytes) -> bytes:
    """
    Apply masking to the data of a WebSocket message.

    :param data: Data to mask
    :param mask: 4-bytes mask

    """
    if len(mask) != 4:
        raise ValueError("mask must contain 4 bytes")

    return bytes(b ^ m for b, m in zip(data, itertools.cycle(mask)))
