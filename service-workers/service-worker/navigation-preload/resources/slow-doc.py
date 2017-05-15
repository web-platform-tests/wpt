import time

def main(req, res):
    time.sleep(1)

    return (
        [
            ('Cache-Control', 'must-revalidate'),
            ('Content-Type', 'text/html')
        ],
       '<!DOCTYPE html>'
    )
