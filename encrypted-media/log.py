def main(request, response):
    with open('../artifacts/suspicious.txt', 'a') as handle:
        handle.write('%s - %s\n' % (
            request.headers.get('referer'), request.GET['name']
        ))
    return ''
