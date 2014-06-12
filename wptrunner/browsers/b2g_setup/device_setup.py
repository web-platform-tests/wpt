from marionette import Marionette
import mozdevice
from optparse import OptionParser


def main(options):
    print "Setting up CertTest app to device"
    dm = None
    if options.adb_path:
        dm = mozdevice.DeviceManagerADB(adbPath=options.adb_path)
    else:
        dm = mozdevice.DeviceManagerADB()
    if dm.dirExists("/data/local/webapps/certtest-app"):
        print "CertTest app is already installed"
        return
    dm.pushFile("certtest_app.zip", "/data/local/certtest_app.zip")
    # forward the marionette port
    print "Forwarding marionette port"
    ret = dm.forward("tcp:2828", "tcp:2828")
    if ret != 0:
        # TODO: right thing here is to keep trying local ports and pass that value in our config
        raise Exception(
            "Can't use localhost:2828 for port forwarding. Is something else using port 2828?")
    # install the app
    print "installing the app"
    f = open("app_install.js", "r")
    script = f.read()
    f.close()
    m = Marionette()
    m.start_session()
    m.set_context("chrome")
    m.set_script_timeout(5000)
    m.execute_async_script(script)
    m.delete_session()


if __name__ == "__main__":
    parser = OptionParser()
    # TODO: take in device serial and marionette port, though likely won't be useful
    parser.add_option("--adb-path", dest="adb_path",
                      help="path to adb executable")
    (options, args) = parser.parse_args()
    main(options)
