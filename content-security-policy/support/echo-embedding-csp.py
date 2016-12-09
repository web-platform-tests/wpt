import json
def main(request, response):
    header = request.headers.get("Embedding-CSP");
    message = {}
    message['embedding_csp'] = header if header else None
    return [("Content-Type", "text/html")], '''
<!DOCTYPE html>
<script>
  window.parent.postMessage({0}, '*');
</script>
'''.format(json.dumps(message))
