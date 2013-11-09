# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
import ConfigParser

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))

from webserver import Httpd
from selenium import webdriver

class WebDriverAuthTest(unittest.TestCase):

	# Response functions to test different Authentication Responses
	

	@classmethod
	def setUpClass(cls):
		config = ConfigParser.ConfigParser()
		config.read('webdriver.cfg')
		cls.driver_class = getattr(webdriver, config.get("Default", 'browser'))
		cls.driver = cls.driver_class()
		def basic_response_func( request, *args ):
				print "basic_response_func!!!"
				return (401, {"WWW-Authenticate" : "Basic"}, None)
		
		basic_auth_handler = { 'method': 'GET',
							'path' : '/navigation/auth_required_basic',
							'function' : basic_response_func }
		urlhandlers = [ basic_auth_handler ]

		cls.webserver = Httpd( urlhandlers=urlhandlers )
		cls.webserver.start()

	@classmethod
	def tearDownClass(cls):
	    cls.driver.quit()
	    cls.webserver.stop()

	def test_response_401_auth_basic(self):

		page = self.webserver.where_is('navigation/auth_required_basic')
		print( "page url = " + page )

#
		resp = self.driver.execute( "get", params={"url" : page})

		print("resp = " + str(resp))
		url = self.driver.current_url
		print("URL = " + url)

	#	self.driver.execute( { })
#		self.assertTrue(False)

if __name__ == "__main__":
    unittest.main()