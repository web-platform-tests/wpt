from time import sleep
def main(request, response):
  if "delay" in request.GET:
    delay = int(request.GET["delay"])
    sleep(delay)

  if "stylesNotMatchingEnvironment" in request.GET:
    return 'h1 {color: green}'
  else:
    return 'h1 {color: red}'
