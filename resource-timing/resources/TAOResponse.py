def main(request, response):
    origin = request.GET.first('origin', request.headers['origin'])
    response.headers.set('Access-Control-Allow-Origin', origin)

    tao = request.GET.first('tao')

    if tao == 'zero':
        pass
    elif tao == 'multi':
        response.headers.set('Timing-Allow-Origin', ['*', '*'])
    elif tao == '*':
        response.headers.set('Timing-Allow-Origin', '*')
    elif tao == 'origin':
        response.headers.set('Timing-Allow-Origin', origin)
    elif tao == 'uppercase':
        response.headers.set('Timing-Allow-Origin', origin.upper())
    else:
        pass