import browser
import sys

usage = 'Usage: %s [browser name] [component] [destination]\n' % sys.argv[0]
components = ['browser', 'webdriver']

def fail(msg):
    sys.stderr.write(msg)
    sys.stderr.write(usage)
    sys.exit(1)

if len(set(sys.argv).intersection(['-h', '--help'])) > 0:
    sys.stdout.write(usage)
    sys.exit(0)

if len(sys.argv) < 3:
    fail('Browser name and component required.\n')

Subclass = getattr(browser, sys.argv[1].title(), None)

if Subclass is None:
    fail('Unrecognized browser name: "%s".\n' % sys.argv[1])

if sys.argv[2] not in components:
    fail('Unrecognized component: "%s".\n' % sys.argv[2])

method = 'install%s' % ('_webdriver' if sys.argv[2] == 'webdriver' else '')

dest = sys.argv[3] if len(sys.argv) > 3 else None

sys.stdout.write('Now installing %s %s...\n' % (sys.argv[1], sys.argv[2]))

getattr(Subclass(), method)(dest=dest)
