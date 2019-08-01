# Chrome for Android

To run WPT on Chrome on an Android device, some additional set up is required.

As with usual Android development, you need to have `adb` and be able to
connect to the device. Run `adb devices` to verify.

Currently, Android support is a prototype with some known issues:

* If you have previously run `./wpt run` against Chrome, you might need to
  remove `_venv/bin/chromedriver` so that we can install the correct
  ChromeDriver corresponding to your Chrome for Android version.
* The package name is hard coded. If you are testing a custom build, you will
  need to search and replace `com.android.chrome` in `tools/`.
* We do not support reftests at the moment.

Note: rooting the device or installing a root CA is no longer required.

Example:

```bash
./wpt run --test-type=testharness chrome_android TESTS
```
