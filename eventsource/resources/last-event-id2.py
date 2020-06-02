ID_PERSISTS = 1
ID_CHANGES_AND_PERSISTS = 2
ID_RESETS = 3

def main(request, response):
  response.headers.set("Content-Type", "text/event-stream")
  try:
    test_type = int(request.GET.first("type", ID_PERSISTS))
  except:
    test_type = ID_PERSISTS

  if test_type == ID_PERSISTS:
    return "id: 1\ndata: 1\n\ndata:2\n\n"

  elif test_type == ID_CHANGES_AND_PERSISTS:
    return "id: 1\ndata: 1\n\nid: 2\ndata:2\n\ndata:3\n\n"

  elif test_type == ID_RESETS:
    return "id: 1\ndata: 1\n\nid:\ndata:2\n\ndata:3\n\n"

  else:
    return "data: invalid_test\n\n"
