#!/usr/bin/python
from six.moves import urllib

def web_socket_do_extra_handshake(request):
    params = urllib.parse.parse_qs(urllib.parse.urlsplit(request.uri).query)

    if 'coep' in params:
        request.extra_headers.append(
            ('Cross-Origin-Embedder-Policy', params['coep'][0])
        )

    if 'corp' in params:
        request.extra_headers.append(
            ('Cross-Origin-Resource-Policy', params['corp'][0])
        )

def web_socket_transfer_data(request):
    # Expect close from user agent.
    request.ws_stream.receive_message()
