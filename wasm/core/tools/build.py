#!/usr/bin/env python
from __future__ import print_function
import argparse
import os
import subprocess
import sys

WASM_SPEC_URL = 'https://github.com/WebAssembly/spec'
WASM_SPEC_SHA1 = '43898ad2b3203eb5c1cfb28ddb0cb585f74b6b48'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
WAST_DIR = os.path.join(ROOT_DIR, 'wast')
JS_DIR = os.path.join(ROOT_DIR, 'js')

SPEC_DIR = os.path.join(ROOT_DIR, 'spec')
INTERP_DIR = os.path.join(SPEC_DIR, 'interpreter')
REF_INTERP = os.path.join(INTERP_DIR, 'wasm')

HEADER = """\
// META: global=jsshell
// META: script=/wasm/core/harness.js
"""

def Exec(errors, *args, **kwargs):
    print('> {}'.format(' '.join(args)))
    try:
        subprocess.check_call(args, **kwargs)
    except subprocess.CalledProcessError as error:
        errors.append('Error: `{}` failed'.format(*args))
        raise


def CheckoutSpecRepo(errors):
    print('Checking out wasm spec repo...')
    try:
        if os.path.isdir(SPEC_DIR):
            Exec(errors, 'git', 'fetch', cwd=SPEC_DIR)
        else:
            Exec(errors, 'git', 'clone', WASM_SPEC_URL, SPEC_DIR)
        Exec(errors, 'git', 'checkout', WASM_SPEC_SHA1, cwd=SPEC_DIR)
        print('Done.\n')
    except subprocess.CalledProcessError as error:
        print('!! Failed to checkout WebAssembly spec repo !!\n')


def BuildSpecInterpreter(errors):
    print('Building spec interpreter...')
    try:
        Exec(errors, 'make', cwd=INTERP_DIR)
        print('Done.\n')
    except subprocess.CalledProcessError as error:
        print('!! Failed to build WebAssembly spec interpreter !!\n')


def ConvertWastToJs(errors):
    print('Converting wast files to JS...')
    for wast_filename in sorted(os.listdir(WAST_DIR)):
        basename, ext = os.path.splitext(wast_filename)
        if ext != '.wast':
            continue

        wast_path = os.path.join(WAST_DIR, wast_filename)
        js_filename = basename + '.any.js'

        tmp_path = os.path.join(JS_DIR, basename + '.tmp.js')
        try:
            Exec(errors, REF_INTERP, '-h', '-d', wast_path, '-o', tmp_path)
        except subprocess.CalledProcessError as error:
            errors.append('Failed to convert {} to {}'.format(
                wast_filename, js_filename))
            continue

        js_path = os.path.join(JS_DIR, js_filename)
        print('> cat HEADER {} > {}'.format(tmp_path, js_path))
        with open(tmp_path, 'r') as tmp_file:
            with open(js_path, 'w') as js_file:
                js_file.write(HEADER)
                js_file.write(tmp_file.read())

        print('> rm {}\n'.format(tmp_path))
        os.remove(tmp_path)
    print('Done.\n')


def main(args):
    parser = argparse.ArgumentParser()
    options = parser.parse_args(args)

    errors = []
    CheckoutSpecRepo(errors)
    BuildSpecInterpreter(errors)
    ConvertWastToJs(errors)

    if errors:
        print('Finished with {} errors:'.format(len(errors)))
        for error in errors:
            print('  {}'.format(error))


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
