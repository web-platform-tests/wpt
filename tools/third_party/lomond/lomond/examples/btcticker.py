from lomond import WebSocket

websocket = WebSocket('wss://ws-feed.gdax.com')

for event in websocket:
    if event.name == "ready":
        websocket.send_json(
            type='subscribe',
            product_ids=['BTC-USD'],
            channels=['ticker']
        )
    elif event.name == "text":
        print(event.json)
