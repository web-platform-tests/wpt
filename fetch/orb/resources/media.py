import os

FILES = {
    "adts": "webcodecs/sfx.adts",
    "flac": "mimesniff/media/resources/flac.flac",
    "mp3": "media/sound_5.mp3",
    "mp4": "mimesniff/media/resources/mp4.mp4",
    "png": "fetch/orb/resources/image.png",
    "webm": "mimesniff/media/resources/webm.webm",
}


def read(request, name):
    with open(os.path.join(request.doc_root, FILES[name]), "rb") as f:
        return f.read()


def matroska(request):
    data = read(request, "webm")
    # Change the EBML DocType from "webm" to "matroska", and grow the EBML
    # header (whose size is a 1-byte vint) accordingly.
    old = b"\x42\x82\x84webm"
    new = b"\x42\x82\x88matroska"
    assert data[4] & 0x80 and old in data
    size = (data[4] & 0x7F) + len(new) - len(old)
    return data[:4] + bytes([0x80 | size]) + data[5:].replace(old, new, 1)


def mp4_with_brand(request, brand):
    data = bytearray(read(request, "mp4"))
    # Replace the major brand and all compatible brands in the ftyp box.
    box_size = int.from_bytes(data[0:4], "big")
    assert data[4:8] == b"ftyp" and len(brand) == 4
    for offset in [8] + list(range(16, box_size, 4)):
        data[offset:offset + 4] = brand
    return bytes(data)


def mp3_320kbps():
    # Silent MPEG-1 Layer III mono frames at 320 kbps and 32 kHz. Each frame
    # is 1440 bytes, so sniffing needs more than 1024 bytes to find the second
    # frame header.
    frame = b"\xFF\xFB\xE8\xC0" + b"\x00" * (1440 - 4)
    return frame * 30


def mjpeg(request):
    png = read(request, "png")
    return (b"--frame\r\nContent-Type: image/png\r\n\r\n" + png +
            b"\r\n--frame--\r\n")


def main(request, response):
    src = request.GET.first(b"src").decode()
    if src == "matroska":
        body = matroska(request)
    elif src == "mp4":
        body = mp4_with_brand(request, request.GET.first(b"brand"))
    elif src == "mp3-320kbps":
        body = mp3_320kbps()
    elif src == "mjpeg":
        body = mjpeg(request)
    else:
        body = read(request, src)

    body = body[int(request.GET.first(b"offset", b"0")):]

    response.headers.set(b"Content-Type", request.GET.first(b"type", b""))
    response.content = body
