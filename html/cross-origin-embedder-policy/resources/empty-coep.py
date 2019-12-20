def main(request, response):
    headers = [('Content-Type', 'text/html')]

    for value in request.GET.get_list('value'):
        headers.append(('Cross-Origin-Embedder-Policy', value))

    return (200, headers, '')
