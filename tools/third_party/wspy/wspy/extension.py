class Extension(object):
    name = ''
    rsv1 = False
    rsv2 = False
    rsv3 = False
    opcodes = ()
    before_fragmentation = False
    defaults = {}

    def __init__(self, **kwargs):
        for param in kwargs.iterkeys():
            if param not in self.defaults:
                raise KeyError('unrecognized parameter "%s"' % param)

        # Copy dict first to avoid duplicate references to the same object
        self.defaults = dict(self.__class__.defaults)
        self.defaults.update(kwargs)

    def __str__(self):
        return '<Extension "%s" defaults=%s request=%s>' \
               % (self.name, self.defaults, self.request)

    @property
    def names(self):
        return (self.name,) if self.name else ()

    def is_supported(self, name, other_instances):
        return name in self.names and not any(self.conflicts(other.extension)
                                              for other in other_instances)

    def conflicts(self, ext):
        """
        Check if the extension conflicts with an already accepted extension.
        This may be the case when the two extensions use the same reserved
        bits, or have the same name (when the same extension is negotiated
        multiple times with different parameters).
        """
        return ext.rsv1 and self.rsv1 \
            or ext.rsv2 and self.rsv2 \
            or ext.rsv3 and self.rsv3 \
            or set(ext.names) & set(self.names) \
            or set(ext.opcodes) & set(self.opcodes)

    def negotiate(self, name, params):
        """
        Same as `negotiate_safe`, but instead returns an iterator of (param,
        value) tuples and raises an exception on error.
        """
        raise NotImplementedError

    def negotiate_safe(self, name, params):
        """
        `name` and `params` are sent in the HTTP request by the client. Check
        if the extension name is supported by this extension, and validate the
        parameters. Returns a dict with accepted parameters, or None if not
        accepted.
        """
        for param in params.iterkeys():
            if param not in self.defaults:
                return

        try:
            return dict(self.negotiate(name, params))
        except (KeyError, ValueError, AssertionError):
            pass

    class Instance:
        def __init__(self, extension, name, params):
            self.extension = extension
            self.name = name
            self.params = params

            for param, value in extension.defaults.iteritems():
                setattr(self, param, value)

            for param, value in params.iteritems():
                setattr(self, param, value)

            self.init()

        def init(self):
            return NotImplemented

        def handle_send(self, frame):
            if self.extension.before_fragmentation:
                assert not frame.is_fragmented()

            replacement = self.onsend(frame)
            return frame if replacement is None else replacement

        def handle_recv(self, frame):
            if self.extension.before_fragmentation:
                assert not frame.is_fragmented()

            replacement = self.onrecv(frame)
            return frame if replacement is None else replacement

        def onsend(self, frame):
            raise NotImplementedError

        def onrecv(self, frame):
            raise NotImplementedError
