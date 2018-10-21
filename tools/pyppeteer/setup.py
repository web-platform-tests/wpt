from setuptools import setup, find_packages

setup(name="pyppeteer",
      version="0.1",
      description="WebDriver client compatible with "
                  "the W3C browser automation specification.",
      author="web-platform-tests maintainers",
      author_email="public-test-infra@w3.org",
      license="BSD",
      packages=find_packages(),
      classifiers=["Development Status :: 4 - Beta",
                   "Intended Audience :: Developers",
                   "Operating System :: OS Independent"])
