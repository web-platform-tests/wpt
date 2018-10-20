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

# https://chromedevtools.github.io/devtools-protocol/1-3/Runtime#type-ExceptionDetails
class ScriptError(PyppeteerError):
    def __init__(self, exception_details):
        message = '{lineNumber}:{columnNumber}'.format(**exception_details)
        exception = exception_details.get('exception')

        if exception:
            if 'className' in exception:
                message += ' {className}'.format(**exception)
            if 'description' in exception:
                message += ' {description}'.format(**exception)

        super(ScriptError, self).__init__(message)
