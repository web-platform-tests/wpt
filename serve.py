import sys

try:
  from tools.serve import serve
except ImportError:
    print("tools.serve not found.  Did you forget to run "
          '"git submodule update --init --recursive"?')
    sys.exit(2)

def main():
    serve.main()
