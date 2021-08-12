from urllib.parse import parse_qs

def connect_received(path: str, response_headers: List[Tuple[bytes, bytes]]):
  qs = parse_qs(path)
  if (qs[":status"]):
    response_headers.append((b":status", str(bin(qs[":status"]))))
  return

