import html
import json
import os
from urllib import parse

EXECUTOR_SCRIPTS = """\
<script src="/common/dispatcher/dispatcher.js"></script>
<script src="/html/browsers/browsing-the-web/remote-context-helper/resources/executor-common.js"></script>
<script src="/html/browsers/browsing-the-web/remote-context-helper/resources/executor-window.js"></script>
"""

class PreProcessingError(Exception):
  def __init__(self, status, body):
    self.response = (status, [], body)

def read_static_page(query, request):
  page = query.get("page", [None])[0]
  if not page:
    return None

  if ".." in page or page.startswith("/"):
    page = page.lstrip("/")

  if ".." in page:
    raise PreProcessingError(400, "Invalid 'page' parameter")

  file_path = os.path.join(request.doc_root, page)
  if not os.path.isfile(file_path):
    raise PreProcessingError(404, f"Page not found: {page}")

  with open(file_path, "r") as f:
    return f.read()

def stamp_executor_block(scripts_s, initRequestHeaders, uuid, start_on_s):
  return f"""\
{EXECUTOR_SCRIPTS}
{scripts_s}
<script>
window.__requestHeaders = new Headers();
{initRequestHeaders}
requestExecutor("{uuid}", {start_on_s});
</script>
"""

def main(request, response):
  initRequestHeaders = ""
  for header_name in request.headers.keys():
    for header_value in request.headers.get_list(header_name):
      js_name = json.dumps(header_name.lower().decode("utf-8"))
      js_value = json.dumps(header_value.decode("utf-8"))
      initRequestHeaders += f"window.__requestHeaders.append({js_name}, {js_value});\n"
      if (b"status" in request.GET):
            status = int(request.GET.first(b"status"))
      else:
            status = 200
  query = parse.parse_qs(request.url_parts.query)

  try:
    page_content = read_static_page(query, request)
  except PreProcessingError as e:
    return e.response

  scripts = []
  for script in query.get("script", []):
    scripts.append(f"<script src='{html.escape(script)}'></script>")
  scripts_s = "\n".join(scripts)

  uuid = query.get("uuid")[0]

  start_on = query.get("startOn")
  start_on_s = f"'{start_on[0]}'" if start_on else "null"

  headers = [("Content-Type", "text/html")]

  if page_content is not None:
    executor_block = stamp_executor_block(scripts_s, initRequestHeaders, uuid, start_on_s)
    lower = page_content.lower()
    body_open = lower.find("<body>")
    if body_open != -1:
      insert_pos = body_open + len("<body>")
      combined = page_content[:insert_pos] + executor_block + page_content[insert_pos:]
    else:
      combined = executor_block + page_content

    return (status, headers, combined)

  # Dynamic page mode: generate a minimal executor page.
  # Base href ensures relative URLs resolve even for data/blob URL documents.
  executor_block = stamp_executor_block(scripts_s, initRequestHeaders, uuid, start_on_s)
  return (status, headers, f"""<!DOCTYPE HTML>
<base href="{html.escape(request.url)}">
{executor_block}<body>
""")
