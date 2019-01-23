import random, string

def token():
   letters = string.ascii_lowercase
   return ''.join(random.choice(letters) for i in range(20))

def main(request, response):
    unique_id = token()
    headers = [("Content-Type", "text/javascript"),
               ("Cache-Control", "private, max-age=0, stale-while-revalidate=10"),
               ("Token", unique_id)]
    content = "report('{}')".format(unique_id)
    return 200, headers, content
