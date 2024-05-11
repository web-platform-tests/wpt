import pytest
import subprocess
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Constants for URLs and paths
BASE_URL = "http://web-platform.test:8000/tools/runner/index.html"
TEST_PATH = "/dom/abort"

# Elements
TEST_PATH_INPUT_FIELD = (By.ID, 'path')
START_BUTTON = (By.XPATH, '//button[text()="Start"]')
DONE_PROGRESS_BAR = (By.CLASS_NAME, "done")
TABLE_CELLS_PASSED = (By.XPATH, '//td[@class="PASS"]')

@pytest.fixture
def driver():
    """
    Sets up before and cleans up after the test.
    """
    # Start the server as a background process
    server_proc = subprocess.Popen(['./wpt', 'serve'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(5)  # Wait a few seconds to ensure the server is up

    driver = webdriver.Chrome()
    yield driver
    # Clean up after tests
    driver.quit()
    server_proc.terminate()
    server_proc.wait() 

def test_runner_smoke(driver):
    """
    Navigates to a web platform test runner and runs specific tests,
    checking for the presence of 'Done!' and at least one 'PASS'.
    """
    driver.get(BASE_URL)  
    test_path_input_field = driver.find_element(*TEST_PATH_INPUT_FIELD)
    test_path_input_field.clear()
    test_path_input_field.send_keys(TEST_PATH)
    driver.find_element(*START_BUTTON).click()
    
    done = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((DONE_PROGRESS_BAR)))
    assert done.text == 'Done!', "Expected to find 'Done!' text when tests are completed."

    passes = driver.find_elements(*TABLE_CELLS_PASSED)
    assert len(passes) > 1, f"Expected table cells to have more than one 'PASS', found {len(passes)}."

