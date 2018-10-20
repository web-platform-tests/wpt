"""
A simple abstraction for an HTTP response.

A response object is supplied in the :class:`~lomond.events.Ready`
event.

"""


from __future__ import unicode_literals

from collections import defaultdict

import six


LWS = (' ', '\t', '\n', '\r')


class Response(object):
    """A HTTP response.

    :param bytes header_data: Raw response.

    """

    def __init__(self, header_data):
        self.raw = header_data
        lines = iter(header_data.split(b'\r\n'))
        status_line = next(lines, b'')
        tokens = iter(status_line.split(None, 2))
        self.http_ver = next(tokens, b'').decode('ascii', 'replace')
        try:
            self.status_code = int(next(tokens, b''))
        except ValueError:
            self.status_code = None
        self.status = next(tokens, b'').decode('ascii', 'replace')

        headers = defaultdict(list)
        header = None
        for _line in lines:
            line = _line.decode('ascii', 'replace')
            if not line.strip():
                continue
            if line.startswith(LWS):
                if header:
                    headers[header].append(' ')
                    headers[header].append(line.lstrip())
            else:
                header, _colon, value = line.partition(':')
                header = header.lower().strip()
                if header in headers:
                    headers[header].append(',')
                headers[header].append(value)

        self.headers = {
            header: ''.join(value).strip()
            for header, value in headers.items()
        }

    def __repr__(self):
        return "<response {} {} {}>".format(
            self.http_ver,
            self.status_code,
            self.status
        )

    def get(self, name, default=None):
        """Get a header.

        :param str name: Name of the header to retrieve.
        :param default: Default value if header is not present.
        :rtype: str

        """
        assert isinstance(name, six.text_type), "must be unicode"
        return self.headers.get(name.lower(), default)

    def get_list(self, name):
        """Extract a list from a header.

        :param bytes name: Name of the header to retrieve.

        :rtype: str
        :returns: A list of strings in the header.

        """
        value = self.get(name, '')
        if not value.strip():
            return []
        parts = [part.strip() for part in value.split(',')]
        return parts
