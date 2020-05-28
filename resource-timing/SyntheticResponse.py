from six.moves.urllib.parse import unquote
import sleep

def main(request, response):
    index = request.request_path.index(u"?")
    args = request.request_path[index+1:].split(u"&")
    headers = []
    statusSent = False
    headersSent = False
    for arg in args:
        if arg.startswith(u"ignored"):
            continue
        elif arg.endswith(u"ms"):
            sleep.sleep_at_least(float(arg[0:-2]))
        elif arg.startswith(u"redirect:"):
            return (302, u"WEBPERF MARKETING"), [(b"Location", unquote(arg[9:]).encode("iso-8859-1"))], u"TEST"
        elif arg.startswith(u"mime:"):
            headers.append((b"Content-Type", unquote(arg[5:]).encode("iso-8859-1")))
        elif arg.startswith(u"send:"):
            text = unquote(arg[5:])

            if not statusSent:
                # Default to a 200 status code.
                response.writer.write_status(200)
                statusSent = True
            if not headersSent:
                for key, value in headers:
                    response.writer.write_header(key, value)
                response.writer.end_headers()
                headersSent = True

            response.writer.write_content(text)
        elif arg.startswith(u"status:"):
            code = int(unquote(arg[7:]))
            response.writer.write_status(code)
            if code // 100 == 1:
                # Terminate informational 1XX responses with an empty line.
                response.writer.end_headers()
            else:
                statusSent = True
        elif arg == u"flush":
            response.writer.flush()

#        else:
#            error "  INVALID ARGUMENT %s" % arg

