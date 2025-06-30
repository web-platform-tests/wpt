class AEADKeyInterface:
    """
    The AEAD key interface.
    """

    def seal(self, pt: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        """
        Encrypts the specified message.

        Args:
            pt (bytes): A plain text to be encrypted.
            nonce (bytes): A nonce for encryption.
            aad (bytes): Additional authenticated data.
        Returns:
            bytes: The encrypted data.
        Raises:
            ValueError: Invalid arguments.
            SealError: Failed to encrypt the plain text.
        """
        raise NotImplementedError()

    def open(self, ct: bytes, nonce: bytes, aad: bytes = b"") -> bytes:
        """
        Decrypts the specified message.

        Args:
            ct (bytes): A cipher text to be decrypted.
            nonce (bytes): A nonce for encryption.
            aad (bytes): Additional authenticated data.
        Returns:
            bytes: The decrypted data.
        Raises:
            ValueError: Invalid arguments.
            OpenError: Failed to decrypt the cipher text.
        """
        raise NotImplementedError()
