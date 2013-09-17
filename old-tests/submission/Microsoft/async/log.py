import time

def main(request, response):
    response.headers.append(("Content-Type", "text/javascript"))
    script_id = request.GET.first("id")
    delay = request.GET.first("sec")
    print script_id, delay
    #Check that we just have an integer
    try:
        int(script_id)
        int(delay)
    except:
        response.set_error(400, "Invalid ID")

    time.sleep(int(delay))

    return "log('%s')" % script_id
