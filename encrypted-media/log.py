def main(request, response):
    with open('../artifacts/suspicious.txt', 'a') as handle:
        handle.write("%s\n" % request.headers.get('referer'))
    return ''
