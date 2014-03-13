"""Element-level WebDriver operations."""

import searchcontext

class WebElement(searchcontext.SearchContext):
    """Corresponds to a DOM element in the current page."""

    def __init__(self, driver, id):
        self.driver = driver
        self.id = id
        self.mode = driver.mode

    def execute(self, method, path, name, body = None):
        """Execute a command against this WebElement."""
        return self.driver.execute(
            method, '/element/' + self.id + path, name, body)

    def is_displayed(self):
        """Is this element displayed?"""
        return self.execute('GET', '/displayed', 'isDisplayed')

    def is_selected(self):
        """Is this checkbox, radio button, or option selected?"""
        return self.execute('GET', '/selected', 'isSelected')

    def get_attribute(self, name):
        """Get the value of an element property or attribute."""
        return self.execute('GET', '/attribute/' + name, 'getElementAttribute')

    def get_text(self):
        """Get the visible text for this element."""
        return self.execute('GET', '/text', 'text')

    def click(self):
        """Click on this element."""
        return self.execute('POST', '/click', 'click')

    def clear(self):
        """Clear the contents of the this text input."""
        self.execute('POST', '/clear', 'clear')

    def send_keys(self, keys):
        """Send keys to this text input or body element."""
        if isinstance(keys, str):
            keys = [ keys ]
        self.execute('POST', '/value', 'sendKeys', { 'value': keys })

    def to_json(self):
        return { 'ELEMENT': self.id }
