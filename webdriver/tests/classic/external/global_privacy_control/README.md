# WebDriver Global Privacy Control API Tests

This directory contains tests for the WebDriver Global Privacy Control (GPC)
API automation capabilities as defined in the GPC specification:

https://w3c.github.io/gpc/#automation

## Overview

Global Privacy Control is a privacy feature that allows users to signal their
preference to opt out of data sharing and selling. Websites can check this
signal via the `navigator.globalPrivacyControl` JavaScript API.

WebDriver extends this with automation capabilities that allow tests to
programmatically set and query the GPC state, enabling automated testing
of privacy-respecting features.
