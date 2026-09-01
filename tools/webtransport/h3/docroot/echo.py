def stream_data_received(session, stream_id, data, stream_ended):
    session.send_stream_data(stream_id, data, end_stream=stream_ended)
