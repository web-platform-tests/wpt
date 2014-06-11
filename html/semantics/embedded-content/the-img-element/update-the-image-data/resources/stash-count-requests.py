import base64
import time

def main(request, response):
    key = request.GET.first("id")
    value = request.server.stash.take(key)
    if value is None:
        value = 0

    if request.GET.first("action") == "take":
        return str(value)
    else:
        request.server.stash.put(key, value + 1)

        response.writer.write_status(200)
        response.writer.write_header("Content-Type", "image/gif")
        if request.GET.first("cached") == "yes":
            response.writer.write_header("Cache-Control", "Max-Age=3600")
        else:
            response.writer.write_header("Cache-Control", "no-store, no-cache, must-revalidate")
            response.writer.write_header("Expires", "Tue, 19 Nov 1985 21:00:00 GMT")
        if request.GET.first("broken") == "yes":
            data = "GIF89aBROKENIMAGE"
            split = 10
        elif request.GET.first("broken") == "fail-sniffing":
            data = "NOTGIFBROKENIMAGE"
            split = 10
        else:
            if request.GET.first("animated") == "no":
                # 1x1 black gif http://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
                data = base64.b64decode("R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=")
                split = 33
            else:
                # 1x1 animated gif from yellow to blue, 500ms delay, no repeat
                data = base64.b64decode("R0lGODlhAQABAPABAP//AP///yH5BAAyAAAALAAAAAABAAEAAAICRAEAIfkEADIAAAAsAAAAAAEAAQCAAAD/////AgJEAQA7")
                split = 41
        if request.GET.first("delay") == "before-dimensions":
            split = 10
        response.writer.write_header("Content-Length", len(data))
        response.writer.end_headers()
        if request.GET.first("delay") == "no":
            response.writer.write(data)
        else:
            response.writer.write(data[:split])
            time.sleep(1)
            response.writer.write(data[split:])
