from setuptools import setup, find_packages

deps = ["six>=1.8", "lomond==0.3.2"]

setup(name="pyppeteer",
      version="0.1",
      description="WebDriver client compatible with "
                  "the W3C browser automation specification.",
      author="web-platform-tests maintainers",
      author_email="public-test-infra@w3.org",
      license="BSD",
      packages=find_packages(),
      install_requires=deps,
      classifiers=["Development Status :: 4 - Beta",
                   "Intended Audience :: Developers",
                   "Operating System :: OS Independent"])
