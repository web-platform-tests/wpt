import struct
import time
import zlib

def make_png(width=1, height=1):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    raw = b"\x00\xff\x00\x00"
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )

IMAGE_PNG = make_png()

def main(request, response):
    delay = float(request.GET.first(b"delay", 3)) / 1000

    response.headers.set(b"Content-Type", b"image/png")
    response.headers.set(b"Content-Length", str(len(IMAGE_PNG)))
    response.headers.set(b"Cache-Control", b"no-store")
    response.write_status_headers()
    # Simulate a slow connection. Useful when we want an <img> to cause
    # load event to be fired when we want to.
    time.sleep(delay)
    response.writer.write_content(IMAGE_PNG)
