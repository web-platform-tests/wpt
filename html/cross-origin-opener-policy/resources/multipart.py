def main(request, response):
    response.add_required_headers = False # Don't implicitly add HTTP headers
    coop = request.GET.first("coop", None)
    body_part_coop = request.GET.first("body_part_coop", None)

    response.writer.write_raw_content("HTTP/1.1 200 OK\n")
    response.writer.write_raw_content(
        "Content-Type: multipart/x-mixed-replace; boundary=foobar\n"
    )
    if coop:
        response.writer.write_raw_content(
            "Cross-Origin-Opener-Policy: {}\n".format(coop)
        )
    response.writer.end_headers()

    response.writer.write_raw_content("--foobar\r\n")
    response.writer.write_raw_content("Content-Type: text/html\r\n")

    if body_part_coop:
        response.writer.write_raw_content(
            "Cross-Origin-Opener-Policy: {}\r\n".format(body_part_coop)
        )

    response.writer.write_raw_content("\r\n")
    response.writer.write_raw_content("""
<!DOCTYPE html>
<meta charset="utf-8">
<script>
  'use strict';
  const params = new URL(location).searchParams;
  const bc = new BroadcastChannel(params.get('channel_name'));

  bc.onmessage = () => close();
</script>

""")
    response.writer.write_raw_content("--foobar\r\n")
