class PyppeteerError(Exception):
    pass

class ConnectionError(PyppeteerError):
    pass

class ProtocolError(PyppeteerError):
    def __init__(self, method, error_details):
        message = error_details['message']
        data = error_details.get('data')

        super(ProtocolError, self).__init__(
            '%s - %s - %s' % (method, message, data)
        )

# https://chromedevtools.github.io/devtools-protocol/tot/Runtime#type-ExceptionDetails
class ScriptError(PyppeteerError):
    def __init__(self, exception_details):
        super(ScriptError, self).__init__((
            '{lineNumber}:{columnNumber} ' +
            '{exception[className]} {exception[description]}'
            ).format(**exception_details)
        )


