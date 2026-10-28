# Sends a burst of datagrams to the client on request.
#
# The other datagram handlers echo what the client wrote, so what the client
# receives is paced by what it sent and datagrams never arrive bunched. This
# handler instead pushes a burst the client never paced, which is what exercises
# the receive path's buffering and the incomingMaxBufferedDatagrams bound.
#
# The client asks for a burst by sending one datagram whose body is the decimal
# number of datagrams it wants. Each datagram sent back carries its own decimal
# sequence number, so the client can tell which ones were dropped.

# Bounds how much a single request can make the server produce.
MAX_DATAGRAMS = 10000


def datagram_received(session, data: bytes):
    try:
        count = int(data)
    except ValueError:
        # Not a request for a burst; ignore rather than guessing.
        return

    count = max(0, min(count, MAX_DATAGRAMS))
    for i in range(count):
        session.send_datagram(str(i).encode())
