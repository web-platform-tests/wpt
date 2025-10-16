# Responds with different content-types and status codes based on
# server-side stash state controlled via query params.
#
# Usage:
# To set the response for future requests with a given key:
#   ?key=token&action=set&code=200&content-type=application/json
#   (code and content-type are optional; defaults are 200 and application/javascript)
# To get the number of times a given key has been requested
#   ?key=token&action=stat
# To get the response for a given key (increments the request count)
#   ?key=token

def main(request, response):
    try:
        stash_key = request.GET.first(b"key", None)
        context = request.server.stash.take(stash_key)

        if not context:
            context = {
                "run_count": 0,
                "status_code": 200,
                "content_type": b"application/javascript",
            }

        action = request.GET.first(b"action", None)
        if action == b"stat":
            response.headers.set(b"Content-Type", b"text/plain")
            response.content = str(context["run_count"])
            request.server.stash.put(stash_key, context)
            return
        elif action == b"set":
            code = request.GET.first(b"code", None)
            if code is not None:
                context["status_code"] = int(code)
            content_type = request.GET.first(b"content-type", None)
            if content_type is not None:
                context["content_type"] = content_type
            request.server.stash.put(stash_key, context)
            response.headers.set(b"Content-Type", b"text/plain")
            response.content = "OK"
            return

        response.status = context["status_code"]

        content_type = context["content_type"]
        response.headers.set(b"Content-Type", content_type)

        if content_type == b"application/javascript":
            response.content = "export default 'hello';"
        elif content_type == b"application/json":
            response.content = '{"hello": "world"}'
        else:
            response.content = "42"

        context["run_count"] += 1
        request.server.stash.put(stash_key, context)
    except Exception as e:
        response.set_error(400, u"Error: %s" % str(e))
