# WebKitWin MiniBrowser

The option `webkitwin_minibrowser` runs the wpt tests using the WebDriver and MiniBrowser of the WebKit on Windows.

This option does not have the feature of downloading the WebDriver externally or finding it on your device.<br>
You must first build WebKit on Windows and specify the path of binary by the arguments of `wpt run`.

To build WebKit on Windows, the following documentation may be helpful:<br>
https://webkit.org/building-webkit-on-windows/

After the binaries are ready, you can run tests with the following command.<br>
Note: The MiniBrowser.exe must be in the same path as WebDriver.exe.

```bash
./wpt run --channel dev --webdriver-binary (path of WebDriver.exe) webkitwin_minibrowser TEST
```
