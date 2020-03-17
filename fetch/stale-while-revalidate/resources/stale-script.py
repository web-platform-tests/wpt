import random, string, datetime, time

def id_token():
   letters = string.ascii_lowercase
   return ''.join(random.choice(letters) for i in range(20))

def main(request, response):
    is_revalidation = request.headers.get("If-None-Match", None)
    if is_revalidation is not None:
      time.sleep(3);
    token = request.GET.first("token", None)
    is_query = request.GET.first("query", None) != None
    query_delay = int(request.GET.first("query_delay", '0'))
    if is_query and query_delay > 0:
      time.sleep(query_delay);

    if not is_query:
      unique_id = id_token()
      response.add_required_headers = False
      response.writer.write_status(200)
      response.writer.write_header("Content-Type", "text/javascript")
      response.writer.write_header("Cache-Control", "private, max-age=0, stale-while-revalidate=60")
      response.writer.write_header("ETag", "swr")
      response.writer.write_header("Unique-Id", unique_id)
      response.writer.end_headers()
      content = "report('{}')".format(unique_id)
      response.writer.write(content)
      success = response.writer.flush();
      # revalidation should be canceled and connection closed
      if is_revalidation and not success:
        return;

    with request.server.stash.lock:
      value = request.server.stash.take(token)
      count = 0
      if value != None:
        count = int(value)
      if is_query:
        if count < 2:
          request.server.stash.put(token, count)
      else:
        count = count + 1
        request.server.stash.put(token, count)

    if is_query:
      headers = [("Count", count)]
      content = ""
      return 200, headers, content
