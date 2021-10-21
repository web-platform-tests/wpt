#!/usr/bin/env python3

import html
import json
import os.path
import urllib.parse

#####

def main(request, response):
  test_set = request.GET.first(b"test_set", b"mime-type-sniffing").decode("utf-8")

  json_file_path = f"mimesniff/mime-type-sniffing/resources/{test_set}.json"

  if not os.path.exists(json_file_path):
    response.status = 404
    return

  with open(json_file_path, "r", encoding="utf-8") as json_file:
    mime_type_sniffing_tests = json.load(json_file)

  # Ensure page isn't cached.
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")

  if b"test_id" in request.GET:
    test_id = int(request.GET.first(b"test_id").decode("utf-8"))

    if 0 <= test_id < len(mime_type_sniffing_tests):
      test = mime_type_sniffing_tests[test_id]

      for (key, value) in test["headers"]:
        response.headers.set(key, value)

      response.content = bytes.fromhex(test["payload"])
    else:
      response.status = 404
      return
  else:
    response.headers.set("Content-Type", "text/html; charset=utf-8")

    response.content.append(f"<!DOCTYPE html><html><head><meta charset=\"utf-8\" /><title>MIME Type Sniffing Tests: {html.escape(test_set)}</title></head><body>\n")
    response.content.append(f"<h1>MIME Type Sniffing Tests: {html.escape(test_set)}</h1>\n")
    response.content.append("<ol>\n")

    for (test_id, test) in enumerate(mime_type_sniffing_tests):
      response.content.append("\t<li value=\"" + html.escape(str(test_id)) + "\"><a href=\"?" + html.escape(urllib.parse.urlencode({ "test_set": test_set, "test_id": str(test_id) })) + "\">" + html.escape(test["description"]) + "</a></li>\n")

    response.content.append("</ol>\n")
    response.content.append("</body></html>\n")
