from typing import Optional, Tuple
from urllib.parse import urlsplit, parse_qsl


def session_established(session):
    path: Optional[bytes] = None
    for key, value in session.request_headers:
        if key == b':path':
            path = value
    assert path is not None
    qs = dict(parse_qsl(urlsplit(path).query))
    code = qs[b'code']
    reason = qs[b'reason'] or b''
    close_info = None if code is None else (int(code), reason)

    session.close(close_info)