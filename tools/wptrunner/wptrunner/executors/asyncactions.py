# mypy: allow-untyped-defs


class BidiSessionSubscribeAction:
    name = "bidi.session.subscribe"

    def __init__(self, logger, protocol):
        self.logger = logger
        self.protocol = protocol

    async def __call__(self, payload):
        return await self.protocol.bidi_events.subscribe(payload["events"], payload["contexts"])


async_actions = [BidiSessionSubscribeAction]
