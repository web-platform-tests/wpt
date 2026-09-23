import time

def main(req, res):
    time.sleep(1)

    return (
        [
            ('Cache-Control', 'no-cache'),
            ('Content-Type', 'text/html')
        ],
       '<!DOCTYPE html>'
    )
