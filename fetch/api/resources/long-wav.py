"""
This generates a 30 minute silent wav, and is capable of
responding to Range requests.
"""
import time
import os
import re

PATH = os.path.dirname(os.path.realpath(__file__))
WAV_HEADER_LENGTH = 44
TOTAL_LENGTH = WAV_HEADER_LENGTH + (44100 * 2 * 60 * 30)


def main(request, response):
    response.headers.set("Content-Type", "audio/wav")
    response.headers.set("Accept-Ranges", "bytes")
    response.headers.set("Cache-Control", "no-cache")

    range_header = request.headers.get('Range', '')
    bytes_to_send = TOTAL_LENGTH
    initial_write = ''

    if range_header:
        response.status = 206
        start, end = re.search(r'^bytes=(\d*)-(\d*)$', range_header).groups()

        start = int(start)
        end = int(end) if end else 0

        if end:
            bytes_to_send = (end + 1) - start
        else:
            bytes_to_send = TOTAL_LENGTH - start

        if start < WAV_HEADER_LENGTH:
            wav_header = open(os.path.join(PATH, 'header.wav')).read()
            initial_write = wav_header[start:]

            if bytes_to_send < len(initial_write):
                initial_write = initial_write[0:bytes_to_send]

        content_range = "bytes {}-{}/{}".format(
            start, end or TOTAL_LENGTH - 1, TOTAL_LENGTH)

        response.headers.set("Content-Range", content_range)
    else:
        initial_write = open(os.path.join(PATH, 'header.wav')).read()

    response.headers.set("Content-Length", bytes_to_send)

    response.write_status_headers()
    response.writer.write(initial_write)

    bytes_to_send -= len(initial_write)

    while bytes_to_send > 0:
        if not response.writer.flush():
            break

        to_send = '\x00' * max(bytes_to_send, 44100)
        bytes_to_send -= len(to_send)

        response.writer.write(to_send)
        time.sleep(0.5)
