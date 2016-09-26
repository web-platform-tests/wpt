# W3C Browser Automation Specification Tests

This repository defines a set of conformance tests for the W3C web
browser automation specification known as WebDriver.  The purpose is
for the different driver implementations to be tested to determine
whether they meet the recognized standard.

## How to run the tests

1. Go to the WebDriver tests: `cd _WEBDRIVER_TEST_ROOT_`
2. Run the tests: `python runtests.py`
3. Run the test against a different config specified in webdriver.cfg:
   `WD_BROWSER=chrome python runtests.py`

To run a specific test file you can just run `python test_file.py`

Similarly you can specify a different browser to run against in webdriver.cfg:
  `WD_BROWSER=chrome python ecmascript/ecmascript_test.py`

Note: that you will likely need to start the driver's server before running.

## Updating configuration

The _webdriver.cfg_ file holds any configuration that the tests might
require.  Change the value of browser to your needs.  This will then
be picked up by WebDriverBaseTest when tests are run.

Be sure not to commit your _webdriver.cfg_ changes when your create or modify tests.

## How to write tests

1. Create a test file per section from the specification.
2. For each test there needs to be one or more corresponding HTML
   files that will be used for testing.  HTML files are not to be
   reused between tests. HTML files and other support files
   should be stored in a folder named 'res'.
3. Test name should explain the intention of the test e.g. `def
   test_navigate_and_return_title(self):`

## Chapters of the Spec that still need tests

Note: Sections that are currently we believe are not quite stable enough for tests yet are in <span style="color:red;">red</span>.
Note: Sections that likely have enough tests for now are marked in <span style="color:green;">green</span>.

* Routing Requests
* List of Endpoints (existance tests)
* List of Error Codes (Description is NON Normative)
* Capabilities
* Sessions
* Delete Session
* Set Timeouts
* Navigation
** Get Current URL
** Back
** Forward
** Refresh
** Get Title
* Command Contexts
** Get Window Handle
** Close Window
** Switch To Window
** Get Window Handles
** Switch To Frame
** Switch To Parent Frame
* Resizing and Positioning Windows
** Get Window Size
** Set Window Size
** Get Window Position 
** Set Window Position
** Maximize Window
** Minimize Window
** Fullscreen Window
* Elements
** Element Interactability
** Get Active Element
* Element Retrieval
** Locator Strategies
*** CSS Selectors
*** Link Text
*** Partial Link Text
*** XPath
** Find Element
** Find Elements
** Find Element from Element
** Find Elements from Element
* Element State
** Is Element Selected
** Get Element Attribute
** Get Element Property
** Get Element CSS value
** Get Element Text
** Get Element Tag name
** Get Element Rect
** Is Element Enabled
* Element Interaction
** Element Click
** Element Clear
** Element Send Keys
* Document Handling
** Getting Page Source
** Executing Script
** Execute Script
** Execute Async Script
* Cookies
** Get All Cookies
** Get Named Cookies
** Add Cookie 
** Delete Cookie
** Delete All Cookies
** Input State
** Processing Actions Requests
** Dispatching Actions
** General Actions
** Keyboard Actions
** Pointer Actions
** Perform Actions
** Remote End Steps (non-Normative)
** Releasing Actions</span>
* User Prompts
** Dismiss Alert
** Accept Alert
** Get Alert Text
** Send Alert Text
* Screen Capture
** Take Screenshot
** Take Element Screenshot
* <span style="color:green;">Privacy</span>
* <span style="color:green;">Security</span>
* Element Displayedness

