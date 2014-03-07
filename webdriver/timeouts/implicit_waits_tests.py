# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
from selenium.common.exceptions import NoSuchElementException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class ImplicitWaitsTests(base_test.WebDriverBaseTest):

    def setUp(self):
        self.driver.get(self.webserver.where_is('timeouts/res/implicit_waits_tests.html'))

    def test_find_element_by_id(self):
        add = self.driver.find_element_by_id("adder")
        self.driver.implicitly_wait(3)
        add.click();
        self.driver.find_element_by_id("box0")  # All is well if this doesn't throw.

    def testShouldStillFailToFindAnElementWhenImplicitWaitsAreEnabled(self):
        self.driver.implicitly_wait(0.5)
        try:
            self.driver.find_element_by_id("box0")
            self.fail("Expected NoSuchElementException to have been thrown")
        except NoSuchElementException as e:
            pass
        except Exception as e:
            self.fail("Expected NoSuchElementException but got " + str(e))

    def testShouldReturnAfterFirstAttemptToFindOneAfterDisablingImplicitWaits(self):
        self.driver.implicitly_wait(3)
        self.driver.implicitly_wait(0)
        try:
            self.driver.find_element_by_id("box0")
            self.fail("Expected NoSuchElementException to have been thrown")
        except NoSuchElementException as e:
            pass
        except Exception as e:
            self.fail("Expected NoSuchElementException but got " + str(e))

    def testShouldImplicitlyWaitUntilAtLeastOneElementIsFoundWhenSearchingForMany(self):
        add = self.driver.find_element_by_id("adder")
        self.driver.implicitly_wait(2)
        add.click();
        add.click();
        elements = self.driver.find_elements_by_class_name("redbox")
        self.assertTrue(len(elements) >= 1)

    def testShouldStillFailToFindAnElemenstWhenImplicitWaitsAreEnabled(self):
        self.driver.implicitly_wait(0.5)
        elements = self.driver.find_elements_by_class_name("redbox")
        self.assertEqual(0, len(elements))

    def testShouldReturnAfterFirstAttemptToFindManyAfterDisablingImplicitWaits(self):
        add = self.driver.find_element_by_id("adder")
        self.driver.implicitly_wait(1.1)
        self.driver.implicitly_wait(0)
        add.click()
        elements = self.driver.find_elements_by_class_name("redbox")
        self.assertEqual(0, len(elements))

if __name__ == "__main__":
    unittest.main()
