def main(_, response):
    response.headers.set("Content-Type", "application/javascript")
    response.headers.set("Accept-Ranges", "bytes")
    response.headers.set("Cache-Control", "no-cache")
    response.status = 206
    content = 'window.scriptExecuted = true'
    content_length = len(content)
    pretend_offset = 5000
    pretend_total = 10000

    content_range = "bytes {}-{}/{}".format(
        pretend_offset,
        pretend_offset + content_length - 1, pretend_total
    )

    response.headers.set("Content-Range", content_range)
    response.headers.set("Content-Length", content_length)

    return content
