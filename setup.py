from setuptools import setup

PACKAGE_VERSION = '0.1'
deps = []

setup(name='wptserve',
      version=PACKAGE_VERSION,
      description="Python webserver intended for in web browser testing",
      long_description=open("README.md").read(),
      classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
      keywords='',
      author='James Graham',
      author_email='james@hoppipolla.co.uk',
      url='http://wptserve.readthedocs.org/',
      license='BSD',
      packages=['wptserve'],
      include_package_data=True,
      zip_safe=False,
      install_requires=deps
      )
