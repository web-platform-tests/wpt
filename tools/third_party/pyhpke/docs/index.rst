Welcome to PyHPKE
=================

PyHPKE is a `HPKE (Hybrid Public Key Encryption)`_ implementation written in Python.

You can install PyHPKE with pip:

.. code-block:: console

    $ pip install pyhpke

And then, you can use it as follows:


.. code-block:: pycon

    >>> from pyhpke import CipherSuite, KEMKey, KEMId, KDFId, AEADId
    >>> public_key_pem = b"-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VuAyEAoMfvlI5DN08JRFP2fhWvZ6vBEl28yFeS9O9YQUjNyCY=\n-----END PUBLIC KEY-----"
    >>> pkr = KEMKey.from_pem(public_key_pem)
    >>> suite = CipherSuite.new(
    ...     KEMId.DHKEM_X25519_HKDF_SHA256, KDFId.HKDF_SHA256, AEADId.AES128_GCM
    ... )
    >>> enc, sender = suite.create_sender_context(pkr)
    >>> ct = sender.seal(b"Hello world!")
    >>>
    >>> private_key_pem = b"-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VuBCIEIMAXvyHjAeXy9x4MXF6rwGbDKw7crgDriFTFXO+XsS1F\n-----END PRIVATE KEY-----"
    >>> skr = KEMKey.from_pem(private_key_pem)
    >>> recipient = suite.create_recipient_context(enc, skr)
    >>> pt = recipient.open(ct)
    >>> pt
    b'Hello world!'

You can find other samples in `PyHPKE README`_.

Index
-----

.. toctree::
   :maxdepth: 2

   installation
   api
   changes

.. _`HPKE (Hybrid Public Key Encryption)`: https://www.rfc-editor.org/rfc/rfc9180.html
.. _`PyHPKE README`: https://github.com/dajiaji/pyhpke#readme
