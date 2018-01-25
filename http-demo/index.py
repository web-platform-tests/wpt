import time

second = '''HTTP/1.1 200 OK
Content-Type: application/javascript
Content-Length: 1

0'''

first = '''HTTP/1.1 204 No Content
Content-Type: application/javascript
Content-Length: %s

''' % len(second)

def main(request, response):
    payload = ''
    leading_characters = int(request.GET.first('leading', '0'))

    if leading_characters > 0:
        payload += 'x' * leading_characters

    if request.GET.first('seq') == '1':
        payload += first
    else:
        payload += second

    response.writer.write(payload)
    response.writer.flush()
