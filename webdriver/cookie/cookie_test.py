# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
from selenium.common.exceptions import UnableToSetCookieException
from selenium.common.exceptions import InvalidCookieDomainException

# from selenium.common.exceptions import ElementNotVisibleException
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))

import base_test

class CookieTest( base_test.WebDriverBaseTest ):

    def test_should_throw_an_exception_the_name_is_null(self):
        VAL = 'foobar'

        self.driver.get( self.webserver.where_is( "cookie_test/cookie_container.html" ))

        try:
          self.driver.add_cookie({ 'name': None, 'value': VAL })
          self.fail( 'should have thrown exceptions.' )

        except UnableToSetCookieException, InvalidCookieDomainException:
          pass

if __name__ == '__main__':
  unittest.main()
