import json


def session_established(session):
    session.dict_for_handlers['streams'] = {}


def stream_data_received(session,
                         stream_id: int,
                         data: bytes,
                         stream_ended: bool):
    streams = session.dict_for_handlers['streams']
    stream = streams.setdefault(stream_id, {
        'marker': None,
        'bytes_received': 0,
    })

    if data:
        if stream['marker'] is None:
            stream['marker'] = data[0]
        stream['bytes_received'] += len(data)

    if not stream_ended:
        return

    counts = {
        str(item['marker']): item['bytes_received']
        for item in streams.values()
        if item['marker'] is not None
    }
    session.send_stream_data(
        stream_id,
        json.dumps(counts).encode('utf-8'),
        end_stream=True)
