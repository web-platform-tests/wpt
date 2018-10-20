#!/usr/bin/env python

from setuptools import setup, find_packages

classifiers = [
    'Development Status :: 5 - Production/Stable',
    'Intended Audience :: Developers',
    'Programming Language :: Python',
    'License :: OSI Approved :: BSD License',
    'Programming Language :: Python :: 2.7',
    'Programming Language :: Python :: 3.3',
    'Programming Language :: Python :: 3.4',
    'Programming Language :: Python :: 3.5',
    'Programming Language :: Python :: 3.6',
    'Topic :: Internet'
]

# http://bit.ly/2alyerp
with open('lomond/_version.py') as f:
    exec(f.read())

with open('README.md') as f:
    long_desc = f.read()

setup(
    name='lomond',
    version=__version__,
    description="Websocket Client Library",
    long_description=long_desc,
    long_description_content_type="text/markdown",
    author='WildFoundry',
    author_email='willmcgugan@gmail.com',
    url='https://github.com/wildfoundry/dataplicity-lomond',
    platforms=['any'],
    packages=find_packages(),
    classifiers=classifiers,
    setup_requires=['pytest-runner'],
    tests_require=['pytest'],
    install_requires=[
        'six>=1.10.0',
    ],
    zip_safe=True
)
