def session_established(session):
    stream_id = session.create_unidirectional_stream()
    session.send_stream_data(stream_id, b'hello')
    session.reset_stream(stream_id, 0x52e4a40fa8db)
