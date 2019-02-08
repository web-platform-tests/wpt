#!/usr/bin/env python
from setuptools import setup

try:
    from pypandoc import convert
    read_md = lambda f: convert(f, 'rst')
except ImportError:
    print 'warning: module pypandoc not found, cannot convert Markdown to RST'
    read_md = lambda f: open(f, 'r').read()

setup(
    name='wspy',
    version='0.9.1',
    description='A standalone implementation of websockets (RFC 6455).',
    long_description=read_md('README.md'),
    author='Taddeus Kroes',
    author_email='taddeus@kompiler.org',
    url='https://github.com/taddeus/wspy',
    package_dir={'wspy': '.'},
    packages=['wspy'],
    license='3-clause BSD License'
)
