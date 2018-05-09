---
layout: page
title: Project Administration
order: -1
---

This section documents all the information necessary to administer the
infrastructure which makes the project possible.

## Secrets

Some aspects of the infrastructure are only accessible to administrators. These
include access credentials for third-party services (e.g. continuous
integration providers), data used to prove identity (e.g. SSL certificates),
and deployment information for the project's running systems (e.g.
[w3c-test.org](https://w3c-test.org)).

Project                   | Secret                   | Owners
--------------------------|--------------------------|-------------
[results-collection]      | root SSH keys            | boaz@bocoup.com, mike@bocoup.com, rick@bocoup.com
[results-collection]      | Password for app secrets | boaz@bocoup.com, mike@bocoup.com, rick@bocoup.com
[pull-requests-dashboard] | root SSH keys            | ???
[pull-requests-dashboard] | Password for app secrets | boaz@bocoup.com, geoffers@gmail.com, jgraham@hoppipolla.co.uk, lukebjerring@google.com, mike@w3.org

SSL certificates for all HTTPS-enabled domains are retrieved via [Let's
Encrypt](https://letsencrypt.org/), so that data does not represent an
explicitly-managed secret.

## Third-party account owners

- (unknown registrar): https://web-platform-tests.org
  - jgraham@hoppipolla.co.uk
- (unknown registrar): https://w3c-test.org
  - ???
- (unknown registrar): http://testthewebforward.org
  - web-human@w3.org
- [Google Domains](https://domains.google/): https://wpt.fyi
  - foolip@google.com
  - jeffcarp@google.com
  - lukebjerring@google.com
  - mike@bocoup.com
- [GitHub](hittps://github.com): web-platform-tests
  - [@foolip](https://github.com/foolip)
  - [@Hexcles](https://github.com/Hexcles)
  - [@jgraham](https://github.com/jgraham)
  - [@plehegar](https://github.com/plehegar)
  - [@thejohnjansen](https://github.com/thejohnjansen)
  - [@youennf](https://github.com/youennf)
  - [@zcorpan](https://github.com/zcorpan)
- [GitHub](https://github.com): w3c
  - ??? (soon to be obviated)
- [Google Cloud Platform](https://cloud.google.com): wptdashboard
  - boaz@bocoup.com
  - foolip@google.com
  - geoffers@gmail.com
  - jeffcarp@google.com
  - kereliuk@google.com
  - lukebjerring@google.com
  - markdittmer@google.com
  - mike@bocoup.com
  - rick@bocoup.com
- [Amazon AWS](https://aws.amazon.com/): results-collection infrastructure
  - boaz@bocoup.com
  - mike@bocoup.com
  - rick@bocoup.com

[pull-requests-dashboard]: https://github.com/web-platform-tests/pulls.web-platform-tests.org
[results-collection]: https://github.com/web-platform-tests/results-collection
[web-platform-tests]: https://github.com/e3c/web-platform-tests
[wpt.fyi]: https://github.com/web-platform-tests/wpt.fyi
