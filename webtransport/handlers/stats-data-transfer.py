# Handler for testing WebTransport stats with data transfer
# This handler sends a configurable amount of data to help test stats collection

def session_established(session):
    # Create a bidirectional stream and send data
    # This helps test bytesSent, bytesReceived, packetsSent, etc.
    stream_id = session.create_bidirectional_stream()

    # Send 5KB of data in one go
    data = b'X' * 5000
    session.send_stream_data(stream_id, data, end_stream=True)


def stream_data_received(session,
                         stream_id: int,
                         data: bytes,
                         stream_ended: bool):
    # Just consume the data - no need to echo for stats testing
    pass


def datagram_received(session, data: bytes):
    # Echo datagrams back
    session.send_datagram(data)
